import Image from "next/image";
import { publishedTestimonials } from "@/config/content";
import { SectionHeading } from "./SectionHeading";

/**
 * Renders only real testimonials whose authors gave permission.
 * With none configured: hidden in production, a clearly marked placeholder in development.
 */
export function Testimonials() {
  const items = publishedTestimonials();

  if (items.length === 0) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <section id="recenzii" aria-label="Recenzii (placeholder de dezvoltare)" className="py-16">
        <div className="container-g">
          <div className="rounded-2xl border border-dashed border-volt/40 p-8 text-center text-sm text-volt-soft">
            [DEV] Secțiunea „Recenzii” este ascunsă în producție până când sunt adăugate testimoniale reale, cu acordul autorilor, în{" "}
            <code>src/config/content.ts</code>.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="recenzii" aria-labelledby="recenzii-title" className="py-24 md:py-32">
      <div className="container-g">
        <SectionHeading id="recenzii-title" eyebrow="Recenzii" title="Ce spun membrii" />
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={t.name + t.quote.slice(0, 20)} className="card flex flex-col p-7">
              <blockquote className="flex-1 text-[0.98rem] leading-relaxed text-fg/90">“{t.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {t.photo && <Image src={t.photo} alt="" width={44} height={44} className="size-11 rounded-full object-cover" />}
                <span>
                  <span className="block text-sm font-semibold">{t.name}</span>
                  {t.role && <span className="block text-xs text-muted">{t.role}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
