import { faq } from "@/config/content";
import { FaqAccordion } from "./FaqAccordion";
import { SectionHeading } from "./SectionHeading";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="py-24 md:py-32">
      <div className="container-g grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Întrebări frecvente" />
        </div>
        <div className="lg:col-span-8">
          <FaqAccordion items={faq} />
        </div>
      </div>
    </section>
  );
}
