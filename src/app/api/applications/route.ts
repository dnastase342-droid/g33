import { NextResponse, type NextRequest } from "next/server";
import { submitApplication } from "@/lib/applications";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isSheetsConfigured } from "@/lib/sheets";
import { applicationRequestSchema, fieldErrors } from "@/lib/validation/application";
import { sameOrigin } from "@/lib/http";

const MAX_BODY_BYTES = 32 * 1024;
const MIN_FILL_MS = 3_000;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;

function fail(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");
  if (!req.headers.get("content-type")?.includes("application/json")) return fail(415, "Format invalid.");
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) return fail(413, "Cererea este prea mare.");

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return fail(400, "Cerere invalidă.");
  }
  if (raw.length > MAX_BODY_BYTES) return fail(413, "Cererea este prea mare.");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "Cerere invalidă.");
  }

  const parsed = applicationRequestSchema.safeParse(body);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    if (errors.website || errors.startedAt || errors.submissionKey) return fail(400, "Cererea nu a putut fi procesată.");
    return fail(400, "Te rugăm să corectezi câmpurile marcate.", { errors });
  }
  const input = parsed.data;

  // Anti-bot timing check (form filled implausibly fast, or stale page).
  const elapsed = Date.now() - input.startedAt;
  if (elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
    return fail(400, "Cererea nu a putut fi procesată. Reîncarcă pagina și încearcă din nou.");
  }

  if (!isSheetsConfigured()) {
    console.error("[applications] Google Sheets is not configured; refusing to accept applications");
    return fail(503, "Aplicațiile nu pot fi primite momentan. Te rugăm să revii mai târziu.");
  }

  let db;
  try {
    db = await getDb();
  } catch {
    console.error("[applications] database unavailable");
    return fail(503, "Aplicațiile nu pot fi primite momentan. Te rugăm să revii mai târziu.");
  }

  const ip = clientIp(req.headers);
  const [byIp, byEmail] = await Promise.all([
    rateLimit(db, "apply-ip", ip, 5, 15 * 60),
    rateLimit(db, "apply-email", input.email, 5, 60 * 60),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return fail(429, "Prea multe încercări. Te rugăm să încerci din nou peste câteva minute.");
  }

  try {
    const result = await submitApplication(input, { db });
    if (result.ok) {
      return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }
    switch (result.reason) {
      case "closed":
        return fail(409, "Aplicările sunt închise momentan: comunitatea a atins capacitatea maximă.");
      case "duplicate_email":
        return fail(409, "Am primit deja o aplicație cu această adresă de email. Echipa G33 o va analiza.");
      case "conflict":
        return fail(409, "Aplicația este deja în curs de procesare. Așteaptă câteva secunde și încearcă din nou.");
      case "storage_failed":
      default:
        return fail(502, "Aplicația nu a putut fi salvată. Datele tale au rămas în formular — te rugăm să încerci din nou.");
    }
  } catch (err) {
    console.error("[applications] unexpected error", { error: err instanceof Error ? err.name : "unknown" });
    return fail(500, "A apărut o eroare. Te rugăm să încerci din nou.");
  }
}
