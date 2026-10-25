import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { baseUrlFrom, sameOrigin } from "@/lib/http";
import { createCheckoutForToken } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { StripeConfigError } from "@/lib/stripe";

const bodySchema = z.object({ token: z.string().min(40).max(60) });

/** Creates a Stripe Checkout Session for an approved applicant's payment link. */
export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, message: "Cerere respinsă." }, { status: 403, headers });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Cerere invalidă." }, { status: 400, headers });

  try {
    const db = await getDb();
    const limit = await rateLimit(db, "checkout-ip", clientIp(req.headers), 10, 10 * 60);
    if (!limit.allowed) {
      return NextResponse.json({ ok: false, message: "Prea multe încercări. Încearcă din nou în câteva minute." }, { status: 429, headers });
    }
    const result = await createCheckoutForToken(parsed.data.token, baseUrlFrom(req), { db });
    if (!result.ok) return NextResponse.json({ ok: false, message: result.error }, { status: result.status, headers });
    return NextResponse.json({ ok: true, url: result.url }, { headers });
  } catch (err) {
    if (err instanceof StripeConfigError) {
      console.error("[checkout] Stripe not configured:", err.message);
      return NextResponse.json({ ok: false, message: "Plățile nu sunt disponibile momentan." }, { status: 503, headers });
    }
    console.error("[checkout] error", { error: err instanceof Error ? err.name : "unknown" });
    return NextResponse.json({ ok: false, message: "Plata nu a putut fi inițiată. Încearcă din nou." }, { status: 500, headers });
  }
}
