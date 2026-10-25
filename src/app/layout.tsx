import type { Metadata, Viewport } from "next";
import { Archivo, Inter, Instrument_Serif } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Suspense } from "react";
import { CookieConsent } from "@/components/CookieConsent";
import { ApplyDialog } from "@/components/apply/ApplyDialog";
import { ApplyDialogWithCapacity } from "@/components/apply/ApplyDialogWithCapacity";
import { brand, getMetadataBase, getSiteUrl, media } from "@/config/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap" });
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  axes: ["wdth"],
});
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const indexable = Boolean(getSiteUrl());

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: `${brand.name} (${brand.shortName}) — comunitate privată de networking`,
    template: `%s · ${brand.shortName}`,
  },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    type: "website",
    locale: brand.locale,
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    images: [{ url: "/images/vsl-poster.jpg", width: 1280, height: 853, alt: "Membrii G33 la o întâlnire" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    images: ["/images/vsl-poster.jpg"],
  },
  // Until the official domain is configured, ask crawlers not to index.
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={brand.language} className={`${inter.variable} ${archivo.variable} ${instrument.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <a
          href="#continut"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-volt focus:px-4 focus:py-2 focus:text-ink"
        >
          Sari la conținut
        </a>
        <Header />
        <main id="continut" className="flex-1">
          {children}
        </main>
        <Footer />
        {/* Application form pop-up, opened by any "Aplică pentru G33" button. */}
        <Suspense fallback={<ApplyDialog applicationsOpen />}>
          <ApplyDialogWithCapacity />
        </Suspense>
        <CookieConsent hasOptionalMedia={Boolean(media.vslUrl || media.meetingYoutubeUrl)} />
      </body>
    </html>
  );
}
