import "server-only";
import { membership } from "@/config/content";
import { getDb, type Queryable } from "./db";

/**
 * Capacity model
 *
 *   confirmed = G33_INITIAL_MEMBER_COUNT (members who joined before this
 *               system; supplied by the owner)
 *             + memberships in the database with status 'active' and not expired
 *
 *   reserved  = applications with an unexpired, unrevoked payment link that
 *               have not paid yet (a seat is held for them)
 *
 * Submitting an application never changes either number.
 *
 * Every operation that could consume a seat takes a transaction-scoped
 * advisory lock first, so concurrent requests are serialized and the cap can
 * never be exceeded.
 */

export const CAPACITY_LOCK_KEY = 330_033;

export function capacityLimits() {
  const initial = Number.isFinite(membership.initialMemberCount) ? membership.initialMemberCount : 0;
  const max = Number.isFinite(membership.maxMembers) ? membership.maxMembers : 200;
  return { initial, max };
}

export async function lockCapacity(tx: Queryable) {
  await tx.query("SELECT pg_advisory_xact_lock($1)", [CAPACITY_LOCK_KEY]);
}

export async function countActiveMembers(db: Queryable, excludeApplicationId?: string): Promise<number> {
  const rows = await db.query<{ n: string | number }>(
    `SELECT count(*) AS n FROM memberships
     WHERE status = 'active' AND (ends_at IS NULL OR ends_at > now())
       AND ($1::text IS NULL OR application_id <> $1::text)`,
    [excludeApplicationId ?? null],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function countReservedSeats(db: Queryable, excludeApplicationId?: string): Promise<number> {
  const rows = await db.query<{ n: string | number }>(
    `SELECT count(DISTINCT pl.application_id) AS n
       FROM payment_links pl
       JOIN applications a ON a.id = pl.application_id
      WHERE pl.revoked_at IS NULL AND pl.expires_at > now()
        AND a.status = 'În așteptarea plății'
        AND ($1::text IS NULL OR pl.application_id <> $1::text)`,
    [excludeApplicationId ?? null],
  );
  return Number(rows[0]?.n ?? 0);
}

export interface CapacitySnapshot {
  confirmed: number;
  reserved: number;
  max: number;
  available: number;
  /** True when the number came from the database (not only the config baseline). */
  fromDatabase: boolean;
}

export async function getCapacity(db: Queryable, excludeApplicationId?: string): Promise<CapacitySnapshot> {
  const { initial, max } = capacityLimits();
  const active = await countActiveMembers(db, excludeApplicationId);
  const reserved = await countReservedSeats(db, excludeApplicationId);
  const confirmed = initial + active;
  return { confirmed, reserved, max, available: Math.max(0, max - confirmed - reserved), fromDatabase: true };
}

/** Public snapshot for the counter. Falls back to the configured baseline if the DB is unavailable. */
export async function getPublicCapacity(): Promise<CapacitySnapshot> {
  const { initial, max } = capacityLimits();
  try {
    const db = await getDb();
    return await getCapacity(db);
  } catch {
    return { confirmed: initial, reserved: 0, max, available: Math.max(0, max - initial), fromDatabase: false };
  }
}

/** Applications are closed when confirmed + reserved seats reach the cap. */
export async function applicationsOpen(db: Queryable): Promise<boolean> {
  const c = await getCapacity(db);
  return c.available > 0;
}
