import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.G33_INITIAL_MEMBER_COUNT = "130";
  process.env.G33_MAX_MEMBERS = "200";
});

import { submitApplication } from "@/lib/applications";
import { applicationRequestSchema } from "@/lib/validation/application";
import { getCapacity } from "@/lib/capacity";
import type { Database } from "@/lib/db";
import type { SheetRow } from "@/lib/sheets";
import { freshDb, seedActiveMembers, validInput } from "./helpers";

const parse = (o: Record<string, unknown> = {}) => applicationRequestSchema.parse(validInput(o));

describe("submitApplication", () => {
  let db: Database;
  let rows: SheetRow[];
  const append = async (r: SheetRow) => {
    rows.push(r);
  };
  const findRow = async (id: string) => {
    const i = rows.findIndex((r) => r.application_id === id);
    return i === -1 ? null : i + 2;
  };

  beforeEach(async () => {
    db = await freshDb();
    rows = [];
  });

  it("writes one row with status Nouă and returns success only after the write", async () => {
    const res = await submitApplication(parse(), { db, append, findRow });
    expect(res.ok).toBe(true);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("Nouă");
    expect(rows[0].application_id).toMatch(/^G33-\d{8}-[A-Z0-9]{8}$/);
    expect(rows[0].submitted_at).toMatch(/Z$/); // UTC
    expect(rows[0].selected_plan).toBe("3 luni");
    // Only name/email/phone are collected; the other sheet columns stay empty.
    for (const c of ["social_profile", "occupation", "income_range", "motivation", "community_contribution"] as const) {
      expect(rows[0][c]).toBe("");
    }
    const synced = await db.query("SELECT sheets_synced_at FROM applications");
    expect(synced[0].sheets_synced_at).not.toBeNull();
  });

  it("does NOT report success when Google Sheets fails", async () => {
    const failing = async () => {
      throw new Error("sheets down");
    };
    const res = await submitApplication(parse(), { db, append: failing, findRow });
    expect(res).toEqual({ ok: false, reason: "storage_failed" });
  });

  it("a retry with the same submission key never creates a duplicate", async () => {
    const input = parse();
    let calls = 0;
    // First attempt: the write reaches the sheet but the response is lost.
    const flaky = async (r: SheetRow) => {
      calls++;
      rows.push(r);
      if (calls === 1) throw new Error("timeout");
    };
    expect((await submitApplication(input, { db, append: flaky, findRow })).ok).toBe(false);
    const retry = await submitApplication(input, { db, append: flaky, findRow });
    expect(retry.ok).toBe(true);
    expect(rows).toHaveLength(1); // found in sheet → not appended again
    const again = await submitApplication(input, { db, append: flaky, findRow });
    expect(again).toMatchObject({ ok: true, duplicate: true });
    expect(rows).toHaveLength(1);
    expect(await db.query("SELECT id FROM applications")).toHaveLength(1);
  });

  it("stores an empty plan when the form was not opened from a plan card", async () => {
    await submitApplication(parse({ preferredPlan: undefined }), { db, append, findRow });
    expect(rows[0].selected_plan).toBe("");
  });

  it("rejects a second open application for the same email", async () => {
    await submitApplication(parse(), { db, append, findRow });
    const res = await submitApplication(parse(), { db, append, findRow });
    expect(res).toEqual({ ok: false, reason: "duplicate_email" });
  });

  it("submitting applications does not change the member count", async () => {
    const before = await getCapacity(db);
    await submitApplication(parse(), { db, append, findRow });
    await submitApplication(parse({ email: "alt@example.com" }), { db, append, findRow });
    const after = await getCapacity(db);
    expect(after.confirmed).toBe(before.confirmed);
    expect(after.confirmed).toBe(130);
  });

  it("closes applications when capacity is reached", async () => {
    await seedActiveMembers(db, 70); // 130 + 70 = 200
    const res = await submitApplication(parse(), { db, append, findRow });
    expect(res).toEqual({ ok: false, reason: "closed" });
    expect(rows).toHaveLength(0);
  });
});
