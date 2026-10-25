import "server-only";
import { randomBytes } from "node:crypto";
import { getPlan } from "@/config/plans";
import { getDb, type Database } from "./db";
import { applicationsOpen } from "./capacity";
import { audit } from "./audit";
import { appendApplicationRow, findApplicationRow, type SheetRow } from "./sheets";
import type { ApplicationRequest } from "./validation/application";

export const PRIVACY_NOTICE_VERSION = "2026-10-16-draft";

export type SubmitResult =
  | { ok: true; applicationId: string; duplicate: boolean }
  | { ok: false; reason: "closed" | "duplicate_email" | "storage_failed" | "conflict" };

/** e.g. G33-20261016-7KQ2M9XW — unique, non-guessable, readable on the phone. */
export function generateApplicationId(now = new Date()): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(8);
  let suffix = "";
  for (const b of bytes) suffix += alphabet[b % alphabet.length];
  const d = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `G33-${d}-${suffix}`;
}

interface Deps {
  db?: Database;
  append?: (row: SheetRow) => Promise<void>;
  findRow?: (id: string) => Promise<number | null>;
}

/**
 * Stores an application.
 *
 * 1. A DB row is created under the client's submission key (unique), so a
 *    retried request can never create a second application.
 * 2. The full row is appended to Google Sheets (valueInputOption=RAW).
 * 3. Only after the append succeeds is the row marked as synced and success
 *    returned. On failure the caller gets `storage_failed` and may retry with
 *    the same submission key; before re-appending we check the sheet so a lost
 *    response cannot produce a duplicate row.
 */
export async function submitApplication(input: ApplicationRequest, deps: Deps = {}): Promise<SubmitResult> {
  const db = deps.db ?? (await getDb());
  const append = deps.append ?? appendApplicationRow;
  const findRow = deps.findRow ?? findApplicationRow;

  const existing = await db.query<{ id: string; email: string; submitted_at: Date | string; sheets_synced_at: unknown }>(
    "SELECT id, email, submitted_at, sheets_synced_at FROM applications WHERE submission_key = $1",
    [input.submissionKey],
  );

  let applicationId: string;
  let submittedAt: Date;

  if (existing[0]) {
    applicationId = existing[0].id;
    submittedAt = new Date(existing[0].submitted_at as string);
    if (existing[0].sheets_synced_at) return { ok: true, applicationId, duplicate: true };
    // Retry after a failed write: the user may have corrected fields meanwhile.
    await db.query(
      "UPDATE applications SET full_name = $2, email = $3, phone = $4, preferred_plan = $5, updated_at = now() WHERE id = $1",
      [applicationId, input.fullName, input.email, input.phone, input.preferredPlan ?? ""],
    );
  } else {
    if (!(await applicationsOpen(db))) return { ok: false, reason: "closed" };

    const open = await db.query(
      `SELECT 1 FROM applications
        WHERE email = $1 AND sheets_synced_at IS NOT NULL
          AND status IN ('Nouă', 'În analiză', 'Acceptată', 'În așteptarea plății', 'Plătită', 'Membru activ')
        LIMIT 1`,
      [input.email],
    );
    if (open.length > 0) return { ok: false, reason: "duplicate_email" };

    applicationId = generateApplicationId();
    submittedAt = new Date();
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO applications
         (id, submission_key, submitted_at, full_name, email, phone, preferred_plan, status,
          privacy_ack_at, privacy_notice_version, marketing_consent, marketing_consent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Nouă', $3, $8, $9, $10)
       ON CONFLICT (submission_key) DO NOTHING
       RETURNING id`,
      [
        applicationId,
        input.submissionKey,
        submittedAt.toISOString(),
        input.fullName,
        input.email,
        input.phone,
        input.preferredPlan ?? "",
        PRIVACY_NOTICE_VERSION,
        false, // no marketing consent is collected by the form
        null,
      ],
    );
    if (!inserted[0]) return { ok: false, reason: "conflict" }; // concurrent retry won the race
  }

  try {
    const alreadyInSheet = existing[0] ? (await findRow(applicationId)) !== null : false;
    if (!alreadyInSheet) {
      await append({
        application_id: applicationId,
        submitted_at: submittedAt.toISOString(),
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        // Columns kept for the sheet layout; the form no longer collects these.
        social_profile: "",
        occupation: "",
        income_range: "",
        motivation: "",
        community_contribution: "",
        selected_plan: input.preferredPlan ? (getPlan(input.preferredPlan)?.formLabel ?? "") : "",
        status: "Nouă",
        admin_notes: "",
      });
    }
  } catch (err) {
    console.error("[applications] Google Sheets write failed", {
      applicationId,
      error: err instanceof Error ? err.name + ": " + err.message : "unknown",
    });
    return { ok: false, reason: "storage_failed" };
  }

  await db.query("UPDATE applications SET sheets_synced_at = now(), updated_at = now() WHERE id = $1", [applicationId]);
  await audit(db, "system", "application.submitted", applicationId, { plan: input.preferredPlan ?? null });
  return { ok: true, applicationId, duplicate: false };
}
