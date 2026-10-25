import { describe, expect, it } from "vitest";
import { applicationRequestSchema, normalizePhone } from "@/lib/validation/application";
import { neutralizeFormula } from "@/lib/sanitize";
import { validInput } from "./helpers";

describe("application validation", () => {
  it("accepts a valid application and normalizes fields", () => {
    const r = applicationRequestSchema.safeParse(validInput({ email: "  Ion.Popescu@Example.COM ", fullName: "  Ion   Popescu " }));
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.email).toBe("ion.popescu@example.com");
    expect(r.data.fullName).toBe("Ion Popescu");
    expect(r.data.phone).toBe("+40752515601");
  });

  it.each([
    ["fullName", ""],
    ["fullName", "Al"],
    ["email", "not-an-email"],
    ["phone", "12345"],
    ["phone", ""],
    ["preferredPlan", "gold"],
  ])("rejects invalid %s", (field, value) => {
    const r = applicationRequestSchema.safeParse(validInput({ [field]: value }));
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues.some((i) => i.path[0] === field)).toBe(true);
  });

  it("rejects a filled honeypot", () => {
    expect(applicationRequestSchema.safeParse(validInput({ website: "http://spam" })).success).toBe(false);
  });

  it("only name, email and phone are required", () => {
    const r = applicationRequestSchema.safeParse(validInput({ preferredPlan: undefined }));
    expect(r.success).toBe(true);
  });

  it("accepts the 599 € yearly plan", () => {
    expect(applicationRequestSchema.safeParse(validInput({ preferredPlan: "yearly" })).success).toBe(true);
  });

  it("Romanian error messages", () => {
    const r = applicationRequestSchema.safeParse(validInput({ email: "x" }));
    expect(r.success ? "" : r.error.issues[0].message).toBe("Adresa de email nu este validă.");
  });
});

describe("phone normalization", () => {
  it.each([
    ["0752 515 601", "+40752515601"],
    ["+40 752 515 601", "+40752515601"],
    ["0040752515601", "+40752515601"],
    ["+44 20 7946 0958", "+442079460958"],
  ])("%s → %s", (input, out) => expect(normalizePhone(input)).toBe(out));
  it("rejects garbage", () => expect(normalizePhone("abc")).toBeNull());
});

describe("formula injection protection", () => {
  it.each(["=HYPERLINK(\"x\")", "+SUM(1)", "-1+2", "@cmd", "\tx", "\rx", "＝1"])("neutralizes %j", (v) => {
    expect(neutralizeFormula(v).startsWith("'")).toBe(true);
  });
  it("leaves normal text untouched", () => expect(neutralizeFormula("Antreprenor")).toBe("Antreprenor"));
  it("strips control characters", () => expect(neutralizeFormula("a\u0000b\u0007c")).toBe("abc"));
});
