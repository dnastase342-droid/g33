import "server-only";
import { JWT } from "google-auth-library";
import { neutralizeFormula } from "./sanitize";

/**
 * Google Sheets integration (server-only).
 *
 * Authenticates as a Google Cloud service account that has Editor access to
 * ONE spreadsheet. Nothing here is exposed to the browser and there is no
 * public endpoint that reads the sheet.
 */

export const SHEET_COLUMNS = [
  "application_id",
  "submitted_at",
  "full_name",
  "email",
  "phone",
  "social_profile",
  "occupation",
  "income_range",
  "motivation",
  "community_contribution",
  "selected_plan",
  "status",
  "admin_notes",
] as const;

export type SheetRow = Record<(typeof SHEET_COLUMNS)[number], string>;

export class SheetsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsConfigError";
  }
}

export class SheetsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SheetsApiError";
  }
}

interface SheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  clientEmail: string;
  privateKey: string;
}

export function getSheetsConfig(): SheetsConfig {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME?.trim() || "Aplicatii G33";
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!spreadsheetId || !clientEmail || !rawKey) {
    throw new SheetsConfigError("Google Sheets environment variables are missing");
  }
  return { spreadsheetId, sheetName, clientEmail, privateKey: normalizePrivateKey(rawKey) };
}

export function isSheetsConfigured(): boolean {
  try {
    getSheetsConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Env vars often store the PEM key with literal "\n" sequences and/or
 * surrounding quotes. Restore real newlines.
 */
export function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

/** A1 notation with the sheet name safely quoted. */
export function a1(sheetName: string, range: string): string {
  return `'${sheetName.replace(/'/g, "''")}'!${range}`;
}

let cachedClient: { key: string; jwt: JWT } | null = null;

async function authHeaders(cfg: SheetsConfig): Promise<Record<string, string>> {
  const cacheKey = `${cfg.clientEmail}`;
  if (!cachedClient || cachedClient.key !== cacheKey) {
    cachedClient = {
      key: cacheKey,
      jwt: new JWT({
        email: cfg.clientEmail,
        key: cfg.privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      }),
    };
  }
  const { token } = await cachedClient.jwt.getAccessToken();
  if (!token) throw new SheetsApiError("Could not obtain Google access token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

const API = "https://sheets.googleapis.com/v4/spreadsheets";

async function sheetsFetch(cfg: SheetsConfig, path: string, init?: RequestInit): Promise<unknown> {
  const headers = await authHeaders(cfg);
  const res = await fetch(`${API}/${encodeURIComponent(cfg.spreadsheetId)}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) {
    // Never include response bodies that may echo data in logs; status is enough.
    throw new SheetsApiError(`Google Sheets API request failed (${res.status})`, res.status);
  }
  return res.json();
}

/** Converts a row object to the ordered, sanitized cell array. */
export function toSheetValues(row: SheetRow): string[] {
  return SHEET_COLUMNS.map((col) => {
    const v = row[col] ?? "";
    // Server-generated / strictly validated values don't need the prefix
    // (and the E.164 phone legitimately starts with "+").
    if (col === "phone" || col === "application_id" || col === "submitted_at") return v;
    return neutralizeFormula(v);
  });
}

/** Appends one application row. Uses RAW so nothing is ever parsed as a formula. */
export async function appendApplicationRow(row: SheetRow): Promise<void> {
  const cfg = getSheetsConfig();
  const range = encodeURIComponent(a1(cfg.sheetName, "A:M"));
  await sheetsFetch(cfg, `/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ majorDimension: "ROWS", values: [toSheetValues(row)] }),
  });
}

/** Returns the 1-based row number of an application ID, or null. */
export async function findApplicationRow(applicationId: string): Promise<number | null> {
  const cfg = getSheetsConfig();
  const range = encodeURIComponent(a1(cfg.sheetName, "A:A"));
  const data = (await sheetsFetch(cfg, `/values/${range}?majorDimension=COLUMNS`)) as {
    values?: string[][];
  };
  const col = data.values?.[0] ?? [];
  const idx = col.indexOf(applicationId);
  return idx === -1 ? null : idx + 1;
}

/** Mirrors the workflow status into column L ("status"). */
export async function updateApplicationStatusInSheet(applicationId: string, status: string): Promise<boolean> {
  const cfg = getSheetsConfig();
  const rowNumber = await findApplicationRow(applicationId);
  if (!rowNumber) return false;
  const range = encodeURIComponent(a1(cfg.sheetName, `L${rowNumber}`));
  await sheetsFetch(cfg, `/values/${range}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [[status]] }),
  });
  return true;
}

/** Writes the header row if the sheet is empty. Used by `npm run sheets:setup`. */
export async function ensureHeaderRow(): Promise<"created" | "exists" | "mismatch"> {
  const cfg = getSheetsConfig();
  const range = encodeURIComponent(a1(cfg.sheetName, "A1:M1"));
  const data = (await sheetsFetch(cfg, `/values/${range}`)) as { values?: string[][] };
  const header = data.values?.[0];
  if (!header || header.length === 0) {
    await sheetsFetch(cfg, `/values/${range}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [[...SHEET_COLUMNS]] }),
    });
    return "created";
  }
  return SHEET_COLUMNS.every((c, i) => header[i] === c) ? "exists" : "mismatch";
}
