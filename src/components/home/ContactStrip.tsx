import Link from "next/link";
import { company } from "@/config/site";

export function ContactStrip() {
  return (
    <section aria-labelledby="contact-strip-title" className="pb-8">
      <div className="container-g">
        <div className="card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center md:p-10">
          <div>
            <p className="eyebrow">Contact</p>
            <h2 id="contact-strip-title" className="mt-4 font-display text-2xl font-bold tracking-tight md:text-3xl">
              Ai o întrebare înainte să aplici?
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a href={company.phoneHref} className="btn btn-primary">
              Sună: {company.phoneDisplay}
            </a>
            <Link href="/contact" className="btn btn-ghost">
              Date de contact
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
