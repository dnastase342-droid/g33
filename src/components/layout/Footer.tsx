import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CookiePreferencesButton } from "@/components/CookieConsent";
import { applyHref, legalNav, mainNav } from "@/config/navigation";
import { brand, company, socialLinks } from "@/config/site";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-line bg-ink-2">
      <div className="led-line absolute inset-x-0 top-0 opacity-60" aria-hidden />
      <div className="container-g grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo size={44} />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">{brand.description}</p>
          <Link href={applyHref} className="btn btn-ghost mt-6 text-sm">
            Aplică pentru G33
          </Link>
        </div>

        <nav aria-label="Secțiuni" className="md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Comunitate</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {mainNav().map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-muted hover:text-fg">
                  {i.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#merch" className="text-muted hover:text-fg">
                Merch
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Informații legale" className="md:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Legal</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {legalNav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-muted hover:text-fg">
                  {i.label}
                </Link>
              </li>
            ))}
            <li>
              <CookiePreferencesButton className="text-muted hover:text-fg" />
            </li>
          </ul>
        </nav>

        <section aria-labelledby="date-societate" className="md:col-span-3">
          <h2 id="date-societate" className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Datele societății
          </h2>
          <address className="mt-4 space-y-2 text-sm not-italic leading-relaxed text-muted">
            <p className="font-medium text-fg">{company.legalName}</p>
            <p>CUI: {company.cui}</p>
            {company.tradeRegisterNumber && <p>Nr. Reg. Com.: {company.tradeRegisterNumber}</p>}
            <p>Sediu social: {company.registeredOffice}</p>
            <p>
              Telefon:{" "}
              <a href={company.phoneHref} className="text-fg underline-offset-4 hover:text-volt hover:underline">
                {company.phoneDisplay}
              </a>
            </p>
            {company.email && (
              <p>
                Email:{" "}
                <a href={`mailto:${company.email}`} className="text-fg hover:text-volt">
                  {company.email}
                </a>
              </p>
            )}
          </address>
          {socialLinks.length > 0 && (
            <ul className="mt-5 flex gap-4 text-sm">
              {socialLinks.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-volt">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="border-t border-line">
        <div className="container-g flex flex-col gap-2 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} {brand.name}. Toate drepturile rezervate.
          </p>
          <p>Plățile sunt procesate securizat prin Stripe.</p>
        </div>
      </div>
    </footer>
  );
}

// Static year avoids request-time Date() in the prerendered shell; bump yearly.
const COPYRIGHT_YEAR = 2026;
