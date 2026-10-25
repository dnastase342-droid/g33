import "server-only";
import { audit } from "../audit";
import { getDb, type Database } from "../db";
import { updateApplicationStatusInSheet } from "../sheets";
import { canAdminTransition, isApplicationStatus, type ApplicationStatus } from "../status";

export interface AdminApplicationRow {
  id: string;
  submitted_at: string | Date;
  full_name: string;
  email: string;
  phone: string;
  preferred_plan: string;
  status: ApplicationStatus;
  marketing_consent: boolean;
  sheets_synced_at: string | Date | null;
  membership_status: string | null;
  membership_ends_at: string | Date | null;
  payment_status: string | null;
}

export async function listApplications(status: string | null, db?: Database): Promise<AdminApplicationRow[]> {
  const database = db ?? (await getDb());
  return database.query<AdminApplicationRow & Record<string, unknown>>(
    `SELECT a.id, a.submitted_at, a.full_name, a.email, a.phone, a.preferred_plan, a.status, a.marketing_consent,
            a.sheets_synced_at, m.status AS membership_status, m.ends_at AS membership_ends_at,
            (SELECT p.status FROM payments p WHERE p.application_id = a.id ORDER BY p.created_at DESC LIMIT 1) AS payment_status
       FROM applications a
       LEFT JOIN memberships m ON m.application_id = a.id
      WHERE ($1::text IS NULL OR a.status = $1::text)
      ORDER BY a.submitted_at DESC
      LIMIT 500`,
    [status],
  );
}

export async function getApplication(id: string, db?: Database) {
  const database = db ?? (await getDb());
  const rows = await listApplicationsById(database, id);
  if (!rows) return null;
  const payments = await database.query<{
    stripe_checkout_session_id: string;
    status: string;
    amount_cents: number | null;
    currency: string | null;
    mode: string;
    created_at: string | Date;
  }>(
    "SELECT stripe_checkout_session_id, status, amount_cents, currency, mode, created_at FROM payments WHERE application_id = $1 ORDER BY created_at DESC",
    [id],
  );
  const links = await database.query<{ id: number; plan_id: string; created_at: string | Date; expires_at: string | Date; revoked_at: string | Date | null }>(
    "SELECT id, plan_id, created_at, expires_at, revoked_at FROM payment_links WHERE application_id = $1 ORDER BY created_at DESC",
    [id],
  );
  const events = await database.query<{ at: string | Date; actor: string; action: string; details: unknown }>(
    "SELECT at, actor, action, details FROM audit_log WHERE application_id = $1 ORDER BY at DESC LIMIT 50",
    [id],
  );
  return { application: rows, payments, links, events };
}

async function listApplicationsById(db: Database, id: string): Promise<AdminApplicationRow | null> {
  const rows = await db.query<AdminApplicationRow & Record<string, unknown>>(
    `SELECT a.id, a.submitted_at, a.full_name, a.email, a.phone, a.preferred_plan, a.status, a.marketing_consent,
            a.sheets_synced_at, m.status AS membership_status, m.ends_at AS membership_ends_at, NULL AS payment_status
       FROM applications a LEFT JOIN memberships m ON m.application_id = a.id
      WHERE a.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export type TransitionResult = { ok: true } | { ok: false; error: string };

/** Validated, audited status change performed by the administrator. */
export async function changeApplicationStatus(id: string, to: string, db?: Database): Promise<TransitionResult> {
  if (!isApplicationStatus(to)) return { ok: false, error: "Status invalid." };
  const database = db ?? (await getDb());
  const result = await database.transaction(async (tx): Promise<TransitionResult> => {
    const rows = await tx.query<{ status: ApplicationStatus }>("SELECT status FROM applications WHERE id = $1 FOR UPDATE", [id]);
    const current = rows[0]?.status;
    if (!current) return { ok: false, error: "Aplicația nu există." };
    if (!canAdminTransition(current, to)) return { ok: false, error: `Tranziția „${current}” → „${to}” nu este permisă.` };
    await tx.query("UPDATE applications SET status = $2, updated_at = now() WHERE id = $1", [id, to]);
    if (to === "Respinsă") {
      await tx.query("UPDATE payment_links SET revoked_at = now() WHERE application_id = $1 AND revoked_at IS NULL", [id]);
    }
    await audit(tx, "admin", "application.status_changed", id, { from: current, to });
    return { ok: true };
  });
  if (result.ok) {
    try {
      await updateApplicationStatusInSheet(id, to);
    } catch {
      console.warn("[admin] could not mirror status to Google Sheets", { id });
    }
  }
  return result;
}

export async function revokePaymentLinks(id: string, db?: Database) {
  const database = db ?? (await getDb());
  const reverted = await database.transaction(async (tx) => {
    await tx.query("UPDATE payment_links SET revoked_at = now() WHERE application_id = $1 AND revoked_at IS NULL", [id]);
    // Without a valid link the application is back to "accepted, not yet invoiced".
    const rows = await tx.query(
      "UPDATE applications SET status = 'Acceptată', updated_at = now() WHERE id = $1 AND status = 'În așteptarea plății' RETURNING id",
      [id],
    );
    await audit(tx, "admin", "payment_link.revoked", id);
    return rows.length > 0;
  });
  if (reverted) {
    try {
      await updateApplicationStatusInSheet(id, "Acceptată");
    } catch {
      /* best effort */
    }
  }
}
