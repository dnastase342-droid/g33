import { beforeEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/admin/password";
import { createSessionValue, verifySessionValue } from "@/lib/admin/auth";
import { changeApplicationStatus } from "@/lib/admin/service";
import { canAdminTransition } from "@/lib/status";
import type { Database } from "@/lib/db";
import { freshDb, seedApplication } from "./helpers";

describe("admin auth", () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = "x".repeat(40);
    process.env.ADMIN_PASSWORD_HASH = hashPassword("correct horse battery");
  });

  it("verifies passwords", () => {
    expect(verifyPassword("correct horse battery", process.env.ADMIN_PASSWORD_HASH)).toBe(true);
    expect(verifyPassword("wrong", process.env.ADMIN_PASSWORD_HASH)).toBe(false);
    expect(verifyPassword("x", "garbage")).toBe(false);
  });

  it("signs and expires sessions", () => {
    const v = createSessionValue();
    expect(verifySessionValue(v)).toBe(true);
    expect(verifySessionValue(v + "x")).toBe(false);
    expect(verifySessionValue(v, Date.now() + 9 * 3600 * 1000)).toBe(false);
    process.env.ADMIN_SESSION_SECRET = "y".repeat(40);
    expect(verifySessionValue(v)).toBe(false);
  });
});

describe("status transitions", () => {
  let db: Database;
  beforeEach(async () => {
    db = await freshDb();
  });

  it("admins cannot mark applications as paid or active", () => {
    expect(canAdminTransition("Acceptată", "Plătită")).toBe(false);
    expect(canAdminTransition("În așteptarea plății", "Membru activ")).toBe(false);
    expect(canAdminTransition("Nouă", "În așteptarea plății")).toBe(false);
    expect(canAdminTransition("Nouă", "Acceptată")).toBe(true);
  });

  it("validates and audits transitions", async () => {
    await seedApplication(db, "G33-20261016-CCCCCCCC", "Nouă");
    expect((await changeApplicationStatus("G33-20261016-CCCCCCCC", "Membru activ", db)).ok).toBe(false);
    expect((await changeApplicationStatus("G33-20261016-CCCCCCCC", "Acceptată", db)).ok).toBe(true);
    const log = await db.query<{ action: string }>("SELECT action FROM audit_log");
    expect(log.map((l) => l.action)).toContain("application.status_changed");
  });
});
