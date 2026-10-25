/**
 * Application, payment and membership statuses are deliberately separate.
 *
 * - Application status: where the applicant is in the selection pipeline.
 *   Values are the Romanian labels the owner uses (also written to Sheets).
 * - Payment status: what Stripe has verified.
 * - Membership status: whether access is currently granted.
 */

export const APPLICATION_STATUSES = [
  "Nouă",
  "În analiză",
  "Acceptată",
  "Respinsă",
  "În așteptarea plății",
  "Plătită",
  "Membru activ",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "expired",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const MEMBERSHIP_STATUSES = [
  "active",
  "past_due",
  "canceled",
  "revoked",
  "expired",
  "capacity_exceeded",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

/**
 * Transitions an administrator may perform manually.
 * "Plătită" and "Membru activ" are set only by verified Stripe events.
 * "În așteptarea plății" is set only by generating a payment link.
 */
const ADMIN_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  "Nouă": ["În analiză", "Acceptată", "Respinsă"],
  "În analiză": ["Acceptată", "Respinsă", "Nouă"],
  "Acceptată": ["Respinsă", "În analiză"],
  "Respinsă": ["În analiză"],
  "În așteptarea plății": ["Respinsă"],
  "Plătită": [],
  "Membru activ": [],
};

export function allowedAdminTransitions(from: ApplicationStatus): ApplicationStatus[] {
  return ADMIN_TRANSITIONS[from] ?? [];
}

export function canAdminTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return allowedAdminTransitions(from).includes(to);
}

/** Statuses from which a payment link may be issued. */
export const PAYABLE_STATUSES: ApplicationStatus[] = ["Acceptată", "În așteptarea plății"];

export function isApplicationStatus(v: unknown): v is ApplicationStatus {
  return typeof v === "string" && (APPLICATION_STATUSES as readonly string[]).includes(v);
}
