import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { processStripeEvent } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook endpoint. The raw body is verified against
 * STRIPE_WEBHOOK_SECRET before anything is processed; processing is
 * idempotent per event ID. Only a 2xx tells Stripe to stop retrying.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    const outcome = await processStripeEvent(event);
    return NextResponse.json({ received: true, duplicate: outcome.duplicate });
  } catch (err) {
    console.error("[webhook] processing failed", { id: event.id, type: event.type, error: err instanceof Error ? err.message : "unknown" });
    // 500 → Stripe retries; the transaction was rolled back so the retry is safe.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
