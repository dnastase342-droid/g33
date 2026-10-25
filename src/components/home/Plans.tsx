import { formatPrice, publishedPlans } from "@/config/plans";
import { PlanCta } from "./PlanCta";
import { SectionHeading } from "./SectionHeading";

const steps = [
  { t: "Aplici", d: "Completezi formularul de aplicare." },
  { t: "Analizăm", d: "Echipa G33 citește fiecare aplicație." },
  { t: "Plătești doar dacă ești acceptat", d: "Primești un link securizat de plată, prin Stripe." },
];

export function Plans() {
  const plans = publishedPlans();
  return (
    <section id="planuri" aria-labelledby="planuri-title" className="relative py-24 md:py-32">
      <div className="glow left-1/2 top-40 h-80 w-[60%] -translate-x-1/2 opacity-30" aria-hidden />
      <div className="container-g relative">
        <SectionHeading
          id="planuri-title"
          eyebrow="Planuri"
          title="Alege cum vrei să faci parte din G33."
          intro="Aplici pentru planul care ți se potrivește. Plata se face numai după ce aplicația este acceptată."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {plans.map((p, i) => {
            const featured = p.id === "lifetime";
            return (
              <article
                key={p.id}
                className={`card card-hover flex flex-col p-8 ${featured ? "border-volt/40 shadow-[0_0_0_1px_rgba(245,228,0,0.15),0_40px_80px_-40px_rgba(245,228,0,0.35)]" : ""}`}
                aria-labelledby={`plan-${p.id}`}
              >
                {featured && <div className="led-line absolute inset-x-8 top-0" aria-hidden />}
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-subtle">Plan {String.fromCharCode(65 + i)}</p>
                <h3 id={`plan-${p.id}`} className="mt-3 font-display text-3xl font-extrabold tracking-tight">
                  {p.name}
                </h3>
                <p className="mt-6 font-display text-5xl font-extrabold tracking-tight">
                  {p.priceCents != null ? formatPrice(p.priceCents, p.currency) : "—"}
                </p>
                <p className="mt-2 text-sm text-muted">Durată: {p.durationLabel}</p>

                {p.benefits.length > 0 ? (
                  <ul className="mt-6 space-y-2 text-sm text-fg/90">
                    {p.benefits.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span aria-hidden className="text-volt">
                          ✓
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-6 text-sm leading-relaxed text-muted">
                    Accesul în comunitatea G33. Detaliile complete ale planului îți sunt comunicate înainte de plată.
                  </p>
                )}
                {p.note && <p className="mt-3 text-xs leading-relaxed text-subtle">{p.note}</p>}

                <div className="mt-auto pt-8">
                  <PlanCta planId={p.id} className={`btn w-full ${featured ? "btn-primary" : "btn-ghost"}`}>
                    Aplică pentru planul {p.name}
                  </PlanCta>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="card mt-4 grid gap-6 p-8 md:grid-cols-[auto_1fr] md:items-center md:gap-12" aria-labelledby="plan-proces">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-subtle">Procesul</p>
            <h3 id="plan-proces" className="mt-3 font-display text-2xl font-bold tracking-tight">
              Cum intri în G33
            </h3>
          </div>
          <div>
            <ol className="grid gap-5 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-volt/50 font-display text-sm font-bold text-volt">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{s.t}</span>
                    <span className="block text-sm text-muted">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs leading-relaxed text-subtle">
              Prețurile sunt în euro. Trimiterea unei aplicații nu creează nicio obligație de plată.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
