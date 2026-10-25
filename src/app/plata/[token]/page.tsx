import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { formatPrice, getPlan } from "@/config/plans";
import { lookupPaymentLink } from "@/lib/payments";
import { CheckoutButton } from "./CheckoutButton";

export const metadata: Metadata = { title: "Plată membru" };

export default function PaymentPage({ params }: PageProps<"/plata/[token]">) {
  return (
    <Suspense fallback={<p className="text-muted">Se verifică linkul de plată…</p>}>
      <PaymentContent params={params} />
    </Suspense>
  );
}

async function PaymentContent({ params }: { params: PageProps<"/plata/[token]">["params"] }) {
  const { token } = await params;
  let link = null;
  try {
    link = await lookupPaymentLink(token);
  } catch {
    link = null;
  }

  if (!link || link.status !== "În așteptarea plății") {
    return (
      <div className="card p-8 md:p-10">
        <p className="eyebrow">Plată</p>
        <h1 className="mt-4 font-display text-3xl font-bold">Link indisponibil</h1>
        <p className="mt-4 text-muted">
          Acest link de plată nu este valid, a expirat sau a fost deja folosit. Dacă ai nevoie de un link nou, contactează echipa G33.
        </p>
        <Link href="/contact" className="btn btn-ghost mt-8">
          Contact
        </Link>
      </div>
    );
  }

  const plan = getPlan(link.planId);
  const firstName = link.fullName.split(" ")[0];

  return (
    <div className="card p-8 md:p-10">
      <p className="eyebrow">Aplicație acceptată</p>
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Bine ai venit, {firstName}.</h1>
      <p className="mt-4 text-muted">
        Aplicația ta în G33 a fost acceptată. Pentru a-ți activa calitatea de membru, finalizează plata securizată prin Stripe.
      </p>

      {plan && (
        <dl className="mt-8 divide-y divide-line rounded-2xl border border-line">
          <div className="flex justify-between gap-4 p-4">
            <dt className="text-muted">Plan</dt>
            <dd className="font-semibold">{plan.name}</dd>
          </div>
          <div className="flex justify-between gap-4 p-4">
            <dt className="text-muted">Durată</dt>
            <dd className="text-right">{plan.durationLabel}</dd>
          </div>
          {plan.priceCents != null && (
            <div className="flex justify-between gap-4 p-4">
              <dt className="text-muted">Total</dt>
              <dd className="font-display text-xl font-bold">{formatPrice(plan.priceCents, plan.currency)}</dd>
            </div>
          )}
        </dl>
      )}

      <p className="mt-6 text-xs leading-relaxed text-subtle">
        Prin continuare confirmi că ai citit{" "}
        <Link href="/termeni-si-conditii" className="underline underline-offset-4" target="_blank">
          Termenii și condițiile
        </Link>{" "}
        și{" "}
        <Link href="/politica-de-anulare-si-rambursare" className="underline underline-offset-4" target="_blank">
          Politica de anulare și rambursare
        </Link>
        . Datele cardului sunt introduse direct pe pagina Stripe; G33 nu le primește și nu le stochează. Linkul expiră la{" "}
        {link.expiresAt.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}.
      </p>

      <CheckoutButton token={token} />
    </div>
  );
}
