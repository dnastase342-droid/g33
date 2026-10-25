import "server-only";
import Stripe from "stripe";
import { getPlan, type PaymentMode, type PlanConfig, type PlanId } from "@/config/plans";

let client: Stripe | null = null;

export class StripeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeConfigError";
  }
}

/** Lazily created so builds work without the secret key present. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new StripeConfigError("STRIPE_SECRET_KEY is not set");
  if (process.env.NODE_ENV === "production" && key.startsWith("sk_live_") && process.env.G33_LIVE_PAYMENTS_ENABLED !== "true") {
    // Live payments must be switched on deliberately (see README launch checklist).
    throw new StripeConfigError("Live Stripe key present but G33_LIVE_PAYMENTS_ENABLED is not 'true'");
  }
  if (!client) client = new Stripe(key, { appInfo: { name: "g33-website" }, maxNetworkRetries: 2 });
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export interface PurchasablePlan {
  plan: PlanConfig;
  priceId: string;
  mode: PaymentMode;
}

/**
 * A plan can be sold only when: it is active, its price is confirmed, a Stripe
 * Price ID is configured, and its payment type (one-time vs. subscription) has
 * been confirmed via G33_PLAN_*_MODE.
 */
export function resolvePurchasablePlan(planId: string): PurchasablePlan | { error: string } {
  const plan = getPlan(planId);
  if (!plan) return { error: "Plan necunoscut." };
  if (!plan.active || plan.priceCents == null) return { error: "Planul nu este disponibil momentan." };
  const priceId = process.env[plan.envPriceKey]?.trim();
  if (!priceId || !priceId.startsWith("price_")) return { error: "Plata pentru acest plan nu este configurată încă." };
  const mode = process.env[plan.envModeKey]?.trim();
  if (mode !== "payment" && mode !== "subscription") return { error: "Tipul de plată pentru acest plan nu este confirmat încă." };
  return { plan, priceId, mode };
}

/**
 * Server-side price validation: the Stripe Price must be active and match the
 * configured amount, currency and payment type exactly.
 */
export async function verifyStripePrice(stripe: Stripe, p: PurchasablePlan): Promise<string | null> {
  const price = await stripe.prices.retrieve(p.priceId);
  if (!price.active) return "Stripe price is inactive";
  if (price.currency !== p.plan.currency) return "Stripe price currency mismatch";
  if (price.unit_amount !== p.plan.priceCents) return "Stripe price amount mismatch";
  const expectedType = p.mode === "subscription" ? "recurring" : "one_time";
  if (price.type !== expectedType) return "Stripe price type mismatch";
  return null;
}

export function planIdFromMetadata(meta: Record<string, string> | null | undefined): PlanId | null {
  const id = meta?.plan_id;
  return id && getPlan(id) ? (id as PlanId) : null;
}
