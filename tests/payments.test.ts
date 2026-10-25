import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.G33_INITIAL_MEMBER_COUNT = "130";
  process.env.G33_MAX_MEMBERS = "200";
  process.env.STRIPE_PRICE_LIFETIME = "price_lifetime_test";
  process.env.G33_PLAN_LIFETIME_MODE = "payment";
  process.env.STRIPE_PRICE_3_MONTHS = "price_3m_test";
  // 3-month payment type intentionally NOT configured
});

import Stripe from "stripe";
import { createCheckoutForToken, issuePaymentLink, processStripeEvent } from "@/lib/payments";
import { getCapacity } from "@/lib/capacity";
import type { Database } from "@/lib/db";
import { freshDb, seedActiveMembers, seedApplication } from "./helpers";

const APP = "G33-20261016-AAAAAAAA";

function paidSessionEvent(id: string, appId: string, overrides: Record<string, unknown> = {}): Stripe.Event {
  return {
    id,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${appId}`,
        object: "checkout.session",
        mode: "payment",
        payment_status: "paid",
        amount_total: 99700,
        currency: "eur",
        payment_intent: `pi_${appId}`,
        subscription: null,
        customer: "cus_1",
        client_reference_id: appId,
        metadata: { application_id: appId, plan_id: "lifetime", payment_link_id: "1" },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}

function withType(ev: Stripe.Event, type: string): Stripe.Event {
  return { ...ev, type } as unknown as Stripe.Event;
}

async function status(db: Database, id: string) {
  const a = await db.query<{ status: string }>("SELECT status FROM applications WHERE id = $1", [id]);
  const m = await db.query<{ status: string }>("SELECT status FROM memberships WHERE application_id = $1", [id]);
  return { app: a[0]?.status, member: m[0]?.status ?? null };
}

describe("payment links", () => {
  let db: Database;
  beforeEach(async () => {
    db = await freshDb();
  });

  it("requires approval before a link can be issued", async () => {
    await seedApplication(db, APP, "Nouă");
    const r = await issuePaymentLink(APP, "lifetime", "test", db);
    expect(r.ok).toBe(false);
  });

  it("refuses plans whose payment type is not confirmed", async () => {
    await seedApplication(db, APP, "Acceptată");
    expect((await issuePaymentLink(APP, "3_months", "test", db)).ok).toBe(false);
  });

  it("refuses the yearly plan until its payment type and Stripe price are configured", async () => {
    await seedApplication(db, APP, "Acceptată");
    expect((await issuePaymentLink(APP, "yearly", "test", db)).ok).toBe(false);
  });

  it("issues a link, reserves a seat and moves the application to În așteptarea plății", async () => {
    await seedApplication(db, APP, "Acceptată");
    const r = await issuePaymentLink(APP, "lifetime", "test", db);
    expect(r.ok).toBe(true);
    expect((await status(db, APP)).app).toBe("În așteptarea plății");
    const cap = await getCapacity(db);
    expect(cap.reserved).toBe(1);
    expect(cap.confirmed).toBe(130);
  });

  it("concurrent approvals can never exceed capacity", async () => {
    await seedActiveMembers(db, 67); // 197 confirmed → 3 seats left
    const ids = Array.from({ length: 8 }, (_, i) => `G33-20261016-CONC000${i}`);
    for (const id of ids) await seedApplication(db, id, "Acceptată");
    const results = await Promise.all(ids.map((id) => issuePaymentLink(id, "lifetime", "test", db)));
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    const cap = await getCapacity(db);
    expect(cap.confirmed + cap.reserved).toBe(200);
  });
});

describe("checkout", () => {
  let db: Database;
  beforeEach(async () => {
    db = await freshDb();
    await seedApplication(db, APP, "Acceptată");
  });

  function fakeStripe(price: Record<string, unknown>) {
    const create = vi.fn(async (params: Stripe.Checkout.SessionCreateParams) => ({
      params,
      id: "cs_test_1",
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    }));
    const stripe = {
      prices: { retrieve: vi.fn(async () => ({ active: true, currency: "eur", unit_amount: 99700, type: "one_time", ...price })) },
      checkout: { sessions: { create } },
    } as unknown as Stripe;
    return { stripe, create };
  }

  it("creates a session with the server-side price and application metadata", async () => {
    const link = await issuePaymentLink(APP, "lifetime", "test", db);
    if (!link.ok) throw new Error("no link");
    const { stripe, create } = fakeStripe({});
    const r = await createCheckoutForToken(link.token, "https://g33.test", { db, stripe });
    expect(r).toMatchObject({ ok: true, url: "https://checkout.stripe.com/c/pay/cs_test_1" });
    const params = create.mock.calls[0][0];
    expect(params.line_items).toEqual([{ price: "price_lifetime_test", quantity: 1 }]);
    expect(params.mode).toBe("payment");
    expect(params.metadata).toMatchObject({ application_id: APP, plan_id: "lifetime" });
    const p = await db.query<{ status: string }>("SELECT status FROM payments");
    expect(p[0].status).toBe("pending");
  });

  it("blocks checkout when the Stripe price does not match the configured amount", async () => {
    const link = await issuePaymentLink(APP, "lifetime", "test", db);
    if (!link.ok) throw new Error("no link");
    const { stripe, create } = fakeStripe({ unit_amount: 100 });
    const r = await createCheckoutForToken(link.token, "https://g33.test", { db, stripe });
    expect(r.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects unknown tokens", async () => {
    const { stripe } = fakeStripe({});
    const r = await createCheckoutForToken("x".repeat(43), "https://g33.test", { db, stripe });
    expect(r).toMatchObject({ ok: false, status: 404 });
  });
});

describe("stripe webhooks", () => {
  let db: Database;
  beforeEach(async () => {
    db = await freshDb();
    await seedApplication(db, APP, "Acceptată");
    const link = await issuePaymentLink(APP, "lifetime", "test", db);
    expect(link.ok).toBe(true);
  });

  it("verifies signatures with the official SDK", () => {
    const stripe = new Stripe("sk_test_dummy");
    const secret = "whsec_test_secret";
    const payload = JSON.stringify(paidSessionEvent("evt_sig", APP));
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(stripe.webhooks.constructEvent(payload, header, secret).id).toBe("evt_sig");
    expect(() => stripe.webhooks.constructEvent(payload, header, "whsec_wrong")).toThrow();
    expect(() => stripe.webhooks.constructEvent(payload.replace("99700", "1"), header, secret)).toThrow();
  });

  it("activates membership only after a verified paid event — exactly once", async () => {
    const ev = paidSessionEvent("evt_1", APP);
    const first = await processStripeEvent(ev, { db });
    expect(first.duplicate).toBe(false);
    expect(await status(db, APP)).toEqual({ app: "Membru activ", member: "active" });
    const cap = await getCapacity(db);
    expect(cap.confirmed).toBe(131);
    expect(cap.reserved).toBe(0);

    const dup = await processStripeEvent(ev, { db });
    expect(dup.duplicate).toBe(true);
    expect((await getCapacity(db)).confirmed).toBe(131);
    expect(await db.query("SELECT id FROM memberships")).toHaveLength(1);
  });

  it("does not activate on an unpaid (async pending) session", async () => {
    await processStripeEvent(paidSessionEvent("evt_2", APP, { payment_status: "unpaid" }), { db });
    expect(await status(db, APP)).toEqual({ app: "În așteptarea plății", member: null });
  });

  it("does not activate on failed or expired payments", async () => {
    await processStripeEvent(withType(paidSessionEvent("evt_3", APP, { payment_status: "unpaid" }), "checkout.session.async_payment_failed"), { db });
    await processStripeEvent(withType(paidSessionEvent("evt_4", APP, { payment_status: "unpaid" }), "checkout.session.expired"), { db });
    expect((await status(db, APP)).member).toBeNull();
    const p = await db.query<{ status: string }>("SELECT status FROM payments");
    expect(p[0].status).toBe("failed");
  });

  it("does not activate when the paid amount differs from the plan", async () => {
    await processStripeEvent(paidSessionEvent("evt_5", APP, { amount_total: 100 }), { db });
    expect((await status(db, APP)).member).toBeNull();
  });

  it("does not activate a payment for an application that was never approved", async () => {
    const other = "G33-20261016-BBBBBBBB";
    await seedApplication(db, other, "Nouă");
    await processStripeEvent(paidSessionEvent("evt_6", other), { db });
    expect(await status(db, other)).toEqual({ app: "Nouă", member: null });
  });

  it("flags instead of activating when capacity is already full", async () => {
    await seedActiveMembers(db, 70);
    await processStripeEvent(paidSessionEvent("evt_7", APP), { db });
    expect(await status(db, APP)).toEqual({ app: "Plătită", member: "capacity_exceeded" });
    expect((await getCapacity(db)).confirmed).toBe(200);
  });

  it("a full refund revokes access", async () => {
    await processStripeEvent(paidSessionEvent("evt_8", APP), { db });
    const refund = {
      id: "evt_9",
      object: "event",
      type: "charge.refunded",
      data: { object: { id: "ch_1", object: "charge", payment_intent: `pi_${APP}`, amount: 99700, amount_refunded: 99700 } },
    } as unknown as Stripe.Event;
    await processStripeEvent(refund, { db });
    expect((await status(db, APP)).member).toBe("revoked");
    expect((await getCapacity(db)).confirmed).toBe(130);
  });

  it("subscription lifecycle updates access", async () => {
    const sub = {
      id: "sub_1",
      object: "subscription",
      status: "active",
      items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }] },
    };
    const ev = paidSessionEvent("evt_10", APP, { mode: "subscription", subscription: "sub_1", payment_intent: null });
    await processStripeEvent(ev, { db, retrieveSubscription: async () => sub as unknown as Stripe.Subscription });
    expect((await status(db, APP)).member).toBe("active");

    const mk = (id: string, type: string, s: string) =>
      ({ id, object: "event", type, data: { object: { ...sub, status: s } } }) as unknown as Stripe.Event;
    await processStripeEvent(mk("evt_11", "customer.subscription.updated", "past_due"), { db });
    expect((await status(db, APP)).member).toBe("past_due");
    expect((await getCapacity(db)).confirmed).toBe(130);
    await processStripeEvent(mk("evt_12", "customer.subscription.updated", "active"), { db });
    expect((await status(db, APP)).member).toBe("active");
    await processStripeEvent(mk("evt_13", "customer.subscription.deleted", "canceled"), { db });
    expect((await status(db, APP)).member).toBe("canceled");
  });
});
