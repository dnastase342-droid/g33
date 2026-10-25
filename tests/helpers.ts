import { randomUUID } from "node:crypto";
import { createPglite, type Database } from "@/lib/db";

let shared: Promise<Database> | null = null;

/** One in-memory Postgres per test file (WASM memory is limited); tables are emptied between tests. */
export async function freshDb(): Promise<Database> {
  shared ??= createPglite();
  const db = await shared;
  await db.query(
    'TRUNCATE applications, payment_links, payments, memberships, stripe_events, rate_limits, audit_log RESTART IDENTITY CASCADE',
  );
  return db;
}

export function validInput(overrides: Record<string, unknown> = {}) {
  return {
    fullName: "Ion Popescu",
    email: "ion.popescu@example.com",
    phone: "0752 515 601",
    preferredPlan: "3_months",
    submissionKey: randomUUID(),
    website: "",
    startedAt: Date.now() - 60_000,
    ...overrides,
  };
}

/** Inserts an application directly (bypassing Sheets) for workflow tests. */
export async function seedApplication(db: Database, id: string, status = "Acceptată", email = `${id.toLowerCase()}@example.com`) {
  await db.query(
    `INSERT INTO applications (id, submission_key, full_name, email, phone, preferred_plan, status, privacy_ack_at, privacy_notice_version)
     VALUES ($1, $2, 'Test User', $3, '+40752515601', 'lifetime', $4, now(), 'test')`,
    [id, randomUUID(), email, status],
  );
}

export async function seedActiveMembers(db: Database, count: number) {
  for (let i = 0; i < count; i++) {
    const id = `G33-20260101-SEED${String(i).padStart(4, "0")}`;
    await seedApplication(db, id, "Membru activ");
    await db.query("INSERT INTO memberships (application_id, plan_id, status) VALUES ($1, 'lifetime', 'active')", [id]);
  }
}
