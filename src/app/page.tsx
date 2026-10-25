import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Meetings } from "@/components/home/Meetings";
import { Testimonials } from "@/components/home/Testimonials";
import { Plans } from "@/components/home/Plans";
import { Merch } from "@/components/home/Merch";
import { Faq } from "@/components/home/Faq";
import { ContactStrip } from "@/components/home/ContactStrip";
import { JsonLd } from "@/components/JsonLd";
import { faq } from "@/config/content";
import { brand, getSiteUrl } from "@/config/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const siteUrl = getSiteUrl();
  return (
    <>
      <Hero />
      <About />
      <Meetings />
      <Testimonials />
      <Plans />
      <Merch />
      <Faq />
      <ContactStrip />
      {/* Structured data: only verified facts (no ratings, prices or events). */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: brand.name,
          alternateName: brand.shortName,
          description: brand.description,
          ...(siteUrl ? { url: siteUrl, logo: `${siteUrl}/images/logo-g33.png` } : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </>
  );
}
