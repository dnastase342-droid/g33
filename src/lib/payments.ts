import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { getPlan } from "@/config/plans";
import { audit } from "./audit";
import { capacityLimits, countActiveMembers, countReservedSeats, lockCapacity } from "./capacity";
import { getDb, type Database, type Queryable } from "./db";
import { updateApplicationStatusInSheet } from "./sheets";
import { PAYABLE_STATUSES, type ApplicationStatus } from "./status";
import { getStripe, resolvePurchasablePlan, verifyStripePrice } from "./stripe";

export const PAYMENT_LINK_TTL_DAYS = Number(process.env.G33_PAYMENT_LINK_TTL_DAYS ?? 7);

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* -------------------------------------------------------------------------- */
/* Payment links (issued by an admin after approval)                          */
/* -------------------------------------------------------------------------- */

export type IssueLinkResult =
  | { ok: true; token: string; expiresAt: Date }
  | { ok: false; error: string };

/**
 * Issues a single-use-per-application payment link. Requires the application
 * to be approved ("Acceptată") and a free seat. Holding a valid link reserves
 * the seat until it expires.
 */
export async function issuePaymentLink(
  applicationId: string,
  planId: string,
  actor: string,
  db?: Database,
): Promise<IssueLinkResult> {
  const database = db ?? (await getDb());
  const purchasable = resolvePurchasablePlan(planId);
  if ("error" in purchasable) return { ok: false, error: purchasable.error };

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PAYMENT_LINK_TTL_DAYS * 24 * 3600 * 1000);

  const result = await database.transaction(async (tx): Promise<IssueLinkResult> => {
    await lockCapacity(tx);
    const rows = await tx.query<{ status: ApplicationStatus }>("SELECT status FROM applications WHERE id = $1 FOR UPDATE", [
      applicationId,
    ]);
    const app = rows[0];
    if (!app) return { ok: false, error: "Aplicația nu există." };
    if (!PAYABLE_STATUSES.includes(app.status)) {
      return { ok: false, error: "Linkul de plată poate fi generat doar pentru aplicații acceptate." };
    }
    const { initial, max } = capacityLimits();
    const used = initial + (await countActiveMembers(tx)) + (await countReservedSeats(tx, applicationId));
    if (used >= max) return { ok: false, error: "Capacitatea maximă a comunității a fost atinsă." };

    await tx.query("UPDATE payment_links SET revoked_at = now() WHERE application_id = $1 AND revoked_at IS NULL", [applicationId]);
    await tx.query(
      "INSERT INTO payment_links (application_id, token_hash, plan_id, expires_at) VALUES ($1, $2, $3, $4)",
      [applicationId, hashToken(token), purchasable.plan.id, expiresAt.toISOString()],
    );
    await tx.query("UPDATE applications SET status = 'În așteptarea plății', updated_at = now() WHERE id = $1", [applicationId]);
    await audit(tx, actor, "payment_link.issued", applicationId, { plan: purchasable.plan.id });
    return { ok: true, token, expiresAt };
  });

  if (result.ok) await mirrorStatus(applicationId, "În așteptarea plății");
  return result;
}

export interface PaymentLinkInfo {
  linkId: number;
  applicationId: string;
  planId: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  expiresAt: Date;
}

export async function lookupPaymentLink(token: string, db?: Queryable): Promise<PaymentLinkInfo | null> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const database = db ?? (await getDb());
  const rows = await database.query<{
    id: number;
    application_id: string;
    plan_id: string;
    full_name: string;
    email: string;
    status: ApplicationStatus;
    expires_at: string | Date;
  }>(
    `SELECT pl.id, pl.application_id, pl.plan_id, a.full_name, a.email, a.status, pl.expires_at
       FROM payment_links pl JOIN applications a ON a.id = pl.application_id
      WHERE pl.token_hash = $1 AND pl.revoked_at IS NULL AND pl.expires_at > now()`,
    [hashToken(token)],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    linkId: r.id,
    applicationId: r.application_id,
    planId: r.plan_id,
    fullName: r.full_name,
    email: r.email,
    status: r.status,
    expiresAt: new Date(r.expires_at),
  };
}

/* -------------------------------------------------------------------------- */
/* Checkout                                                                   */
/* -------------------------------------------------------------------------- */

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string; status: number };

export async function createCheckoutForToken(token: string, baseUrl: string, deps: { db?: Database; stripe?: Stripe } = {}): Promise<CheckoutResult> {
  const db = deps.db ?? (await getDb());
  const link = await lookupPaymentLink(token, db);
  if (!link) return { ok: false, error: "Linkul de plată nu este valid sau a expirat.", status: 404 };
  if (link.status !== "În așteptarea plății") {
    return { ok: false, error: "Această aplicație nu mai așteaptă o plată.", status: 409 };
  }

  const purchasable = resolvePurchasablePlan(link.planId);
  if ("error" in purchasable) return { ok: false, error: purchasable.error, status: 409 };

  // The seat is reserved by this link, but re-check confirmed members (excluding self).
  const { initial, max } = capacityLimits();
  if (initial + (await countActiveMembers(db, link.applicationId)) >= max) {
    return { ok: false, error: "Capacitatea maximă a comunității a fost atinsă.", status: 409 };
  }

  const stripe = deps.stripe ?? getStripe();
  const priceProblem = await verifyStripePrice(stripe, purchasable);
  if (priceProblem) {
    console.error("[checkout] price validation failed", { plan: purchasable.plan.id, problem: priceProblem });
    return { ok: false, error: "Plata nu poate fi inițiată momentan. Te rugăm să contactezi echipa G33.", status: 503 };
  }

  const metadata = { application_id: link.applicationId, plan_id: purchasable.plan.id, payment_link_id: String(link.linkId) };
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: purchasable.mode,
    line_items: [{ price: purchasable.priceId, quantity: 1 }],
    customer_email: link.email,
    client_reference_id: link.applicationId,
    metadata,
    locale: "ro",
    success_url: `${baseUrl}/plata/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/plata/anulat`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1h
  };
  if (purchasable.mode === "payment") {
    params.payment_intent_data = { metadata };
    params.customer_creation = "always";
  } else {
    params.subscription_data = { metadata };
  }

  // Idempotency key: double clicks within the same minute reuse one session.
  const idempotencyKey = `g33-checkout-${link.linkId}-${Math.floor(Date.now() / 60_000)}`;
  const session = await stripe.checkout.sessions.create(params, { idempotencyKey });

  await db.query(
    `INSERT INTO payments (application_id, plan_id, mode, stripe_checkout_session_id, amount_cents, currency, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     ON CONFLICT (stripe_checkout_session_id) DO NOTHING`,
    [link.applicationId, purchasable.plan.id, purchasable.mode, session.id, purchasable.plan.priceCents, purchasable.plan.currency],
  );
  await audit(db, "applicant", "checkout.created", link.applicationId, { plan: purchasable.plan.id });

  if (!session.url) return { ok: false, error: "Sesiunea de plată nu a putut fi creată.", status: 502 };
  return { ok: true, url: session.url };
}

/* -------------------------------------------------------------------------- */
/* Webhooks                                                                   */
/* -------------------------------------------------------------------------- */

export interface WebhookOutcome {
  duplicate: boolean;
  handled: boolean;
  sheetUpdates: { applicationId: string; status: ApplicationStatus }[];
}

function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const ends = sub.items?.data?.map((i) => i.current_period_end).filter((n): n is number => typeof n === "number") ?? [];
  if (ends.length === 0) return null;
  return new Date(Math.max(...ends) * 1000);
}

interface ProcessDeps {
  db?: Database;
  /** Used to fetch subscription period info. */
  retrieveSubscription?: (id: string) => Promise<Stripe.Subscription>;
}

/**
 * Processes a VERIFIED Stripe event exactly once.
 *
 * The event ID is inserted inside the same transaction as its effects, so a
 * duplicate delivery is a no-op and a failure rolls back both (Stripe retries).
 */
export async function processStripeEvent(event: Stripe.Event, deps: ProcessDeps = {}): Promise<WebhookOutcome> {
  const db = deps.db ?? (await getDb());
  const retrieveSubscription = deps.retrieveSubscription ?? ((id: string) => getStripe().subscriptions.retrieve(id));

  // Fetch remote data before opening the transaction (no network calls while holding locks).
  let subscription: Stripe.Subscription | null = null;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const subId = idOf(event.data.object.subscription);
    if (subId) subscription = await retrieveSubscription(subId);
  }

  const outcome: WebhookOutcome = { duplicate: false, handled: false, sheetUpdates: [] };

  await db.transaction(async (tx) => {
    const fresh = await tx.query("INSERT INTO stripe_events (id, type) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id", [
      event.id,
      event.type,
    ]);
    if (fresh.length === 0) {
      outcome.duplicate = true;
      return;
    }

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          await handlePaidSession(tx, session, subscription, outcome);
        } else {
          // e.g. delayed payment methods: stay pending until async_payment_succeeded.
          await upsertPaymentFromSession(tx, session, "pending");
        }
        outcome.handled = true;
        break;
      }
      case "checkout.session.async_payment_failed": {
        await upsertPaymentFromSession(tx, event.data.object, "failed");
        const appId = event.data.object.metadata?.application_id;
        if (appId) await audit(tx, "stripe", "payment.failed", appId);
        outcome.handled = true;
        break;
      }
      case "checkout.session.expired": {
        await tx.query("UPDATE payments SET status = 'expired', updated_at = now() WHERE stripe_checkout_session_id = $1 AND status = 'pending'", [
          event.data.object.id,
        ]);
        outcome.handled = true;
        break;
      }
      case "charge.refunded": {
        await handleRefund(tx, event.data.object, outcome);
        outcome.handled = true;
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscriptionChange(tx, event.data.object, event.type === "customer.subscription.deleted", outcome);
        outcome.handled = true;
        break;
      }
      default:
        break;
    }
    await tx.query("UPDATE stripe_events SET processed_at = now() WHERE id = $1", [event.id]);
  });

  for (const u of outcome.sheetUpdates) await mirrorStatus(u.applicationId, u.status);
  return outcome;
}

async function upsertPaymentFromSession(tx: Queryable, session: Stripe.Checkout.Session, status: string) {
  const appId = session.metadata?.application_id ?? session.client_reference_id;
  const planId = session.metadata?.plan_id;
  if (!appId || !planId) return null;
  const rows = await tx.query<{ id: number; application_id: string }>(
    `INSERT INTO payments (application_id, plan_id, mode, stripe_checkout_session_id, stripe_payment_intent_id,
                           stripe_subscription_id, stripe_customer_id, amount_cents, currency, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (stripe_checkout_session_id) DO UPDATE SET
       stripe_payment_intent_id = COALESCE(EXCLUDED.stripe_payment_intent_id, payments.stripe_payment_intent_id),
       stripe_subscription_id   = COALESCE(EXCLUDED.stripe_subscription_id, payments.stripe_subscription_id),
       stripe_customer_id       = COALESCE(EXCLUDED.stripe_customer_id, payments.stripe_customer_id),
       amount_cents             = EXCLUDED.amount_cents,
       currency                 = EXCLUDED.currency,
       status = CASE WHEN payments.status IN ('paid', 'refunded', 'partially_refunded') AND EXCLUDED.status <> 'paid'
                     THEN payments.status ELSE EXCLUDED.status END,
       updated_at = now()
     RETURNING id, application_id`,
    [
      appId,
      planId,
      session.mode === "subscription" ? "subscription" : "payment",
      session.id,
      idOf(session.payment_intent),
      idOf(session.subscription),
      idOf(session.customer),
      session.amount_total,
      session.currency,
      status,
    ],
  );
  return rows[0] ?? null;
}

async function handlePaidSession(
  tx: Queryable,
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription | null,
  outcome: WebhookOutcome,
) {
  const appId = session.metadata?.application_id;
  const planId = session.metadata?.plan_id;
  const plan = planId ? getPlan(planId) : undefined;
  if (!appId || !plan) {
    console.error("[webhook] paid session without valid metadata", { session: session.id });
    return;
  }

  // Defensive amount/currency check against the configured plan.
  if (plan.priceCents != null && (session.amount_total !== plan.priceCents || session.currency !== plan.currency)) {
    await upsertPaymentFromSession(tx, session, "paid");
    await audit(tx, "stripe", "payment.amount_mismatch", appId, { session: session.id });
    console.error("[webhook] paid amount does not match plan; membership NOT activated", { session: session.id });
    return;
  }

  const apps = await tx.query<{ status: ApplicationStatus }>("SELECT status FROM applications WHERE id = $1 FOR UPDATE", [appId]);
  const app = apps[0];
  if (!app) {
    console.error("[webhook] paid session for unknown application", { session: session.id });
    return;
  }

  await upsertPaymentFromSession(tx, session, "paid");

  // Approval is a precondition: a payment link is only issued after acceptance.
  const approved = await tx.query("SELECT 1 FROM payment_links WHERE application_id = $1 LIMIT 1", [appId]);
  if (approved.length === 0 || !["În așteptarea plății", "Acceptată", "Plătită"].includes(app.status)) {
    await audit(tx, "stripe", "payment.received_without_approval", appId, { status: app.status });
    return;
  }

  await tx.query("UPDATE applications SET status = 'Plătită', updated_at = now() WHERE id = $1", [appId]);
  await audit(tx, "stripe", "payment.paid", appId, { plan: plan.id, mode: session.mode });

  // Activation under the capacity lock.
  await lockCapacity(tx);
  const { initial, max } = capacityLimits();
  const others = await countActiveMembers(tx, appId);
  const now = new Date();

  if (initial + others >= max) {
    await tx.query(
      `INSERT INTO memberships (application_id, plan_id, status) VALUES ($1, $2, 'capacity_exceeded')
       ON CONFLICT (application_id) DO UPDATE SET status = 'capacity_exceeded', updated_at = now()`,
      [appId, plan.id],
    );
    await audit(tx, "system", "membership.capacity_exceeded_refund_required", appId);
    outcome.sheetUpdates.push({ applicationId: appId, status: "Plătită" });
    return;
  }

  const endsAt =
    session.mode === "subscription"
      ? subscription
        ? subscriptionPeriodEnd(subscription)
        : null
      : plan.durationMonths
        ? addMonths(now, plan.durationMonths)
        : null;

  await tx.query(
    `INSERT INTO memberships (application_id, plan_id, status, started_at, ends_at, stripe_subscription_id)
     VALUES ($1, $2, 'active', now(), $3, $4)
     ON CONFLICT (application_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id, status = 'active', ends_at = EXCLUDED.ends_at,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id, updated_at = now()`,
    [appId, plan.id, endsAt ? endsAt.toISOString() : null, idOf(session.subscription)],
  );
  await tx.query("UPDATE applications SET status = 'Membru activ', updated_at = now() WHERE id = $1", [appId]);
  await tx.query("UPDATE payment_links SET revoked_at = now() WHERE application_id = $1 AND revoked_at IS NULL", [appId]);
  await audit(tx, "system", "membership.activated", appId, { plan: plan.id });
  outcome.sheetUpdates.push({ applicationId: appId, status: "Membru activ" });
}

async function handleRefund(tx: Queryable, charge: Stripe.Charge, outcome: WebhookOutcome) {
  const pi = idOf(charge.payment_intent);
  if (!pi) return;
  const full = charge.amount_refunded >= charge.amount;
  const rows = await tx.query<{ application_id: string; mode: string }>(
    "UPDATE payments SET status = $2, updated_at = now() WHERE stripe_payment_intent_id = $1 RETURNING application_id, mode",
    [pi, full ? "refunded" : "partially_refunded"],
  );
  const payment = rows[0];
  if (!payment) return;
  await audit(tx, "stripe", full ? "payment.refunded" : "payment.partially_refunded", payment.application_id);
  if (full) {
    // Full refund of a one-time purchase revokes access. Partial refunds are left for manual review.
    const revoked = await tx.query(
      "UPDATE memberships SET status = 'revoked', updated_at = now() WHERE application_id = $1 AND status IN ('active', 'past_due', 'capacity_exceeded') RETURNING id",
      [payment.application_id],
    );
    if (revoked.length > 0) {
      await audit(tx, "system", "membership.revoked_after_refund", payment.application_id);
    }
  }
  void outcome;
}

async function handleSubscriptionChange(tx: Queryable, sub: Stripe.Subscription, deleted: boolean, outcome: WebhookOutcome) {
  const rows = await tx.query<{ application_id: string; status: string }>(
    "SELECT application_id, status FROM memberships WHERE stripe_subscription_id = $1",
    [sub.id],
  );
  const m = rows[0];
  if (!m || m.status === "revoked" || m.status === "capacity_exceeded") return;

  let next: string;
  if (deleted || sub.status === "canceled" || sub.status === "incomplete_expired") next = "canceled";
  else if (sub.status === "active" || sub.status === "trialing") next = "active";
  else next = "past_due"; // past_due, unpaid, incomplete, paused → access suspended

  const endsAt = subscriptionPeriodEnd(sub);
  await tx.query("UPDATE memberships SET status = $2, ends_at = COALESCE($3, ends_at), updated_at = now() WHERE application_id = $1", [
    m.application_id,
    next,
    endsAt ? endsAt.toISOString() : null,
  ]);
  if (next !== m.status) {
    await audit(tx, "stripe", `membership.${next}`, m.application_id, { subscription_status: sub.status });
  }
  void outcome;
}

/** Best-effort mirror of the workflow status into the Google Sheet. */
async function mirrorStatus(applicationId: string, status: ApplicationStatus) {
  try {
    await updateApplicationStatusInSheet(applicationId, status);
  } catch (err) {
    console.warn("[sheets] status mirror failed", { applicationId, error: err instanceof Error ? err.name : "unknown" });
  }
}
