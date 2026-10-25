import { describe, expect, it } from "vitest";
import { a1, normalizePrivateKey, SHEET_COLUMNS, toSheetValues, type SheetRow } from "@/lib/sheets";

describe("google sheets helpers", () => {
  it("has the 13 required columns in order", () => {
    expect(SHEET_COLUMNS).toEqual([
      "application_id", "submitted_at", "full_name", "email", "phone", "social_profile", "occupation",
      "income_range", "motivation", "community_contribution", "selected_plan", "status", "admin_notes",
    ]);
  });

  it("restores newlines in env private keys", () => {
    const k = normalizePrivateKey('"-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n"');
    expect(k).toBe("-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n");
  });

  it("quotes sheet names in A1 ranges", () => {
    expect(a1("Aplicatii G33", "A:M")).toBe("'Aplicatii G33'!A:M");
    expect(a1("O'Brien", "A1")).toBe("'O''Brien'!A1");
  });

  it("sanitizes user text but keeps the E.164 phone", () => {
    const row = Object.fromEntries(SHEET_COLUMNS.map((c) => [c, ""])) as SheetRow;
    row.phone = "+40752515601";
    row.motivation = "=IMPORTXML(\"http://x\")";
    row.full_name = "@admin";
    const values = toSheetValues(row);
    expect(values[4]).toBe("+40752515601");
    expect(values[8]).toBe("'=IMPORTXML(\"http://x\")");
    expect(values[2]).toBe("'@admin");
  });
});
