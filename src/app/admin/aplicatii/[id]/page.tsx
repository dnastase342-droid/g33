import Link from "next/link";
import { Suspense } from "react";
import { isAdmin } from "@/lib/admin/auth";
import { getApplication } from "@/lib/admin/service";
import { allowedAdminTransitions, PAYABLE_STATUSES } from "@/lib/status";
import { resolvePurchasablePlan } from "@/lib/stripe";
import { formatPrice, getPlan, plans } from "@/config/plans";
import { IssueLinkForm, RevokeLinksForm, StatusForm } from "../../ui";

export default function ApplicationPage({ params }: PageProps<"/admin/aplicatii/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Se încarcă…</p>}>
      <Content params={params} />
    </Suspense>
  );
}

const fmt = (d: string | Date | null) =>
  d ? new Date(d).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "short", timeStyle: "short" }) : "—";

async function Content({ params }: { params: PageProps<"/admin/aplicatii/[id]">["params"] }) {
  if (!(await isAdmin())) {
    return (
      <p>
        Sesiune expirată.{" "}
        <Link href="/admin" className="text-volt underline">
          Autentifică-te
        </Link>
      </p>
    );
  }
  const { id } = await params;
  const data = await getApplication(id);
  if (!data) return <p className="text-muted">Aplicația nu există.</p>;
  const { application: a, payments, links, events } = data;

  const planChoices = plans
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, label: `${p.name}${p.priceCents != null ? ` — ${formatPrice(p.priceCents)}` : ""}`, ready: !("error" in resolvePurchasablePlan(p.id)) }));
  const activeLinks = links.filter((l) => !l.revoked_at && new Date(l.expires_at) > new Date());

  return (
    <div className="space-y-8">
      <Link href="/admin" className="text-sm text-muted hover:text-fg">
        ← Toate aplicațiile
      </Link>
      <div>
        <p className="font-mono text-xs text-subtle">{a.id}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{a.full_name}</h1>
        <p className="mt-2 text-sm text-muted">
          {a.email} · {a.phone} · trimisă {fmt(a.submitted_at)}
        </p>
        <p className="mt-1 text-xs text-subtle">
          Răspunsurile complete se află în Google Sheet (rândul cu acest ID). Marketing: {a.marketing_consent ? "acord dat" : "fără acord"}.
          {!a.sheets_synced_at && <span className="ml-2 text-danger">Atenție: nu a fost confirmată scrierea în Google Sheets.</span>}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Info label="Status aplicație" value={a.status} />
        <Info label="Plan preferat" value={getPlan(a.preferred_plan)?.name ?? "Neales"} />
        <Info label="Membru" value={a.membership_status ? `${a.membership_status}${a.membership_ends_at ? ` (până la ${fmt(a.membership_ends_at)})` : ""}` : "—"} />
      </div>

      <section className="card p-6">
        <h2 className="font-display text-lg font-bold">Status</h2>
        <div className="mt-4">
          <StatusForm id={a.id} options={allowedAdminTransitions(a.status)} />
        </div>
      </section>

      {PAYABLE_STATUSES.includes(a.status) && (
        <section className="card space-y-4 p-6">
          <h2 className="font-display text-lg font-bold">Link de plată</h2>
          <p className="text-sm text-muted">
            Generează un link securizat și trimite-l manual aplicantului (email/WhatsApp). Linkul rezervă un loc până expiră. Membrul este
            activat automat doar după confirmarea plății de către Stripe.
          </p>
          <IssueLinkForm id={a.id} plans={planChoices} defaultPlan={a.preferred_plan || planChoices[0]?.id || ""} />
          {activeLinks.length > 0 && <RevokeLinksForm id={a.id} />}
        </section>
      )}

      <section className="card p-6">
        <h2 className="font-display text-lg font-bold">Plăți</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nicio plată.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {payments.map((p) => (
              <li key={p.stripe_checkout_session_id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-mono text-xs">{p.stripe_checkout_session_id.slice(0, 24)}…</span>
                <span>{p.status}</span>
                <span className="text-muted">
                  {p.amount_cents != null ? formatPrice(p.amount_cents, p.currency ?? "eur") : "—"} · {p.mode} · {fmt(p.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg font-bold">Jurnal</h2>
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {events.map((e, i) => (
            <li key={i}>
              {fmt(e.at)} · <span className="text-fg">{e.action}</span> · {e.actor}
              {e.details ? ` · ${JSON.stringify(e.details)}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-subtle">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
