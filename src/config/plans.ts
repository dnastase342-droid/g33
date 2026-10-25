/**
 * Membership plans.
 *
 * Commercial terms that the owner has NOT confirmed stay `null` / unpublished:
 *  - the payment type (one-time vs. recurring) of every plan → set via env
 *    (G33_PLAN_*_MODE) once confirmed; checkout stays disabled until then
 *  - the benefits of each plan → empty list, nothing is invented
 *
 * Stripe Price IDs come from env so no fabricated IDs live in the code.
 */

export type PlanId = "3_months" | "yearly" | "lifetime";
export type PaymentMode = "payment" | "subscription";

export interface PlanConfig {
  id: PlanId;
  name: string;
  /** Short label used in the application form. */
  formLabel: string;
  /** Price in the smallest currency unit (cents). null = not confirmed. */
  priceCents: number | null;
  currency: "eur";
  /** Human readable duration. */
  durationLabel: string;
  /** Length of access for one-time purchases. null = no fixed length (lifetime). */
  durationMonths: number | null;
  /** Confirmed benefits only. */
  benefits: string[];
  /** Displayed on the public site. */
  published: boolean;
  /** Can be purchased (still requires env Price ID + payment mode). */
  active: boolean;
  /** Extra note shown on the card. */
  note?: string;
  envPriceKey: string;
  envModeKey: string;
}

export const plans: PlanConfig[] = [
  {
    id: "3_months",
    name: "3 luni",
    formLabel: "3 luni",
    priceCents: 300_00,
    currency: "eur",
    durationLabel: "3 luni",
    durationMonths: 3,
    benefits: [],
    published: true,
    active: true,
    envPriceKey: "STRIPE_PRICE_3_MONTHS",
    envModeKey: "G33_PLAN_3_MONTHS_MODE",
  },
  {
    id: "yearly",
    name: "1 an",
    formLabel: "1 an",
    priceCents: 599_00, // confirmed by the owner: 599 €
    currency: "eur",
    durationLabel: "12 luni",
    durationMonths: 12,
    benefits: [],
    published: true,
    active: true,
    envPriceKey: "STRIPE_PRICE_YEARLY",
    envModeKey: "G33_PLAN_YEARLY_MODE",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    formLabel: "Lifetime",
    priceCents: 997_00,
    currency: "eur",
    durationLabel: "Acces pe termen nelimitat, conform termenilor contractuali",
    durationMonths: null,
    benefits: [],
    published: true,
    active: true,
    note: "Durata și condițiile exacte ale accesului sunt stabilite prin contract.",
    envPriceKey: "STRIPE_PRICE_LIFETIME",
    envModeKey: "G33_PLAN_LIFETIME_MODE",
  },
];

export const planIds = plans.map((p) => p.id) as [PlanId, ...PlanId[]];

export function getPlan(id: string): PlanConfig | undefined {
  return plans.find((p) => p.id === id);
}

export function publishedPlans(): PlanConfig[] {
  return plans.filter((p) => p.published);
}

export function formatPrice(cents: number, currency = "eur"): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
