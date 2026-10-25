/**
 * Centralized brand + company configuration.
 *
 * Everything shown publicly about the company comes from here, so it can be
 * changed in one place. Values set to `null` are NOT yet supplied/confirmed by
 * the owner and are intentionally hidden on the site — do not fill them with
 * guesses.
 */

export const brand = {
  name: "GRUPAREA 33",
  shortName: "G33",
  founder: "Alex Ciobanu",
  tagline: "Nu e un curs. Nu e un simplu grup de Discord.",
  description:
    "G33 este o comunitate privată construită în jurul networking-ului, al întâlnirilor și al interacțiunii reale dintre membri selectați.",
  locale: "ro_RO",
  language: "ro",
} as const;

export const company = {
  /** Supplied by the owner. Do not change without written confirmation. */
  legalName: "2SPACE ADVERTISING SOLUTIONS SRL",
  cui: "46504448",
  registeredOffice: "Drumul Gura Arieșului Nr. 77–85, Sector 3, București, România",
  phoneDisplay: "0752 515 601",
  phoneE164: "+40752515601",
  phoneHref: "tel:+40752515601",

  /** Not supplied yet — hidden until filled in. */
  tradeRegisterNumber: null as string | null,
  email: null as string | null,
  vatStatus: null as string | null,

  /**
   * Must be confirmed in writing before the company is presented as the
   * seller / payment recipient / GDPR data controller for G33.
   */
  confirmedAsSeller: false,
  confirmedAsDataController: false,
} as const;

/** Only verified, official accounts. Empty until supplied. */
export const socialLinks: { label: string; href: string }[] = [];

/**
 * Canonical site URL. Comes from NEXT_PUBLIC_SITE_URL once the official
 * domain is confirmed. Without it the site tells crawlers not to index.
 */
export function getSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl() ?? "http://localhost:3000");
}

export const media = {
  /** VSL video URL (YouTube or direct .mp4), supplied by the owner. Env overrides it. */
  vslUrl: process.env.NEXT_PUBLIC_VSL_URL?.trim() || "https://youtu.be/cSmEKEm4FMc",
  vslPoster: "/images/vsl-poster.jpg",
  /** YouTube video of a physical meeting. Not supplied yet. */
  meetingYoutubeUrl: process.env.NEXT_PUBLIC_MEETING_YOUTUBE_URL?.trim() || null,
} as const;

/**
 * Legal documents are drafts until reviewed by a lawyer. While `false`, every
 * legal page shows a draft notice and is excluded from indexing.
 */
export const legal = {
  reviewed: false,
  lastUpdated: "2026-10-16",
} as const;

/** Information the owner still has to supply. Shown in admin + README. */
export const missingInformation = [
  "Numărul de înregistrare la Registrul Comerțului",
  "Adresa de email oficială",
  "Domeniul oficial al site-ului",
  "Statutul de plătitor de TVA",
  "Confirmarea că 2SPACE ADVERTISING SOLUTIONS SRL este vânzătorul și beneficiarul plăților G33",
  "Confirmarea rolului de operator de date (GDPR)",
  "Termenii finali ai abonamentelor și politica de anulare/rambursare",
  "Tipul de plată pentru fiecare plan (unică sau abonament recurent)",
  "Beneficiile confirmate ale fiecărui plan",
  "URL-ul YouTube al întâlnirii fizice",
  "Testimoniale reale, cu acordul persoanelor",
  "Conturile oficiale de social media",
] as const;
