import type { Metadata } from "next";
import Link from "next/link";
import { brand, company, socialLinks } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact și date societate",
  description: `Date de contact ${brand.name} (${brand.shortName}) și datele societății.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-g max-w-4xl py-16 md:py-24">
      <p className="eyebrow">Contact</p>
      <h1 className="h-section mt-5">Hai să vorbim.</h1>
      <p className="lead mt-5 max-w-2xl">
        Pentru întrebări despre comunitate sau despre aplicația ta, ne poți suna. Dacă vrei să faci parte din G33, cel mai rapid drum este
        formularul de aplicare.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <section className="card p-8" aria-labelledby="contact-direct">
          <h2 id="contact-direct" className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Contact direct
          </h2>
          <a href={company.phoneHref} className="mt-4 block font-display text-3xl font-bold tracking-tight hover:text-volt">
            {company.phoneDisplay}
          </a>
          {company.email && (
            <a href={`mailto:${company.email}`} className="mt-2 block text-muted hover:text-volt">
              {company.email}
            </a>
          )}
          {socialLinks.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-3 text-sm">
              {socialLinks.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !min-h-10">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Link href="/#aplica" className="btn btn-primary mt-8">
            Aplică pentru G33
          </Link>
        </section>

        <section className="card p-8" aria-labelledby="date-societate-contact">
          <h2 id="date-societate-contact" className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Datele societății
          </h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-subtle">Denumire</dt>
              <dd className="mt-1 font-semibold">{company.legalName}</dd>
            </div>
            <div>
              <dt className="text-subtle">CUI</dt>
              <dd className="mt-1">{company.cui}</dd>
            </div>
            {company.tradeRegisterNumber && (
              <div>
                <dt className="text-subtle">Nr. Reg. Com.</dt>
                <dd className="mt-1">{company.tradeRegisterNumber}</dd>
              </div>
            )}
            <div>
              <dt className="text-subtle">Sediu social</dt>
              <dd className="mt-1">{company.registeredOffice}</dd>
            </div>
            <div>
              <dt className="text-subtle">Telefon</dt>
              <dd className="mt-1">
                <a href={company.phoneHref} className="hover:text-volt">
                  {company.phoneDisplay}
                </a>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
