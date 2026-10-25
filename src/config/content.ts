/**
 * Editable public copy (Romanian). Keep claims limited to confirmed facts.
 */
import { company } from "./site";

export const membership = {
  /**
   * Members confirmed before this system went live (supplied by the owner).
   * Confirmed members recorded in the database are added on top.
   * Can be overridden with G33_INITIAL_MEMBER_COUNT.
   */
  initialMemberCount: Number(process.env.G33_INITIAL_MEMBER_COUNT ?? 130),
  /** Hard capacity. Can be overridden with G33_MAX_MEMBERS. */
  maxMembers: Number(process.env.G33_MAX_MEMBERS ?? 200),
};

export const about = {
  eyebrow: "Ce este G33",
  title: "O comunitate privată, construită pe oameni — nu pe conținut.",
  paragraphs: [
    "G33 nu îți vinde lecții și nu e încă un server unde mesajele se pierd. Este un cerc de oameni care se întâlnesc, vorbesc direct și își construiesc relații de business în timp.",
    "Comunitatea se formează prin selecție. Fiecare aplicație este citită, iar intrarea se face doar după acceptare — pentru ca discuțiile să rămână la un nivel bun pentru toți cei din grup.",
  ],
  pillars: [
    {
      title: "Pentru cine",
      text: "Pentru oameni care construiesc ceva — antreprenori, profesioniști și oameni ambițioși care vor să cunoască alți oameni la fel de implicați.",
    },
    {
      title: "De ce selecție",
      text: "Un grup mic și ales cu grijă înseamnă conversații mai sincere și relații mai solide. Calitatea oamenilor contează mai mult decât numărul lor.",
    },
    {
      title: "Cum interacționează membrii",
      text: "Prin întâlniri fizice, call-uri video săptămânale și contact direct între membri — nu prin postări trimise în gol.",
    },
  ],
};

export const meetings = {
  eyebrow: "Meeting-uri",
  title: "Ne vedem. Pe bune.",
  intro:
    "Relațiile se construiesc în timp și față în față. De aceea, ritmul comunității este simplu și constant.",
  items: [
    {
      kicker: "Lunar",
      title: "Întâlnire fizică",
      text: "O întâlnire fizică pe lună, unde membrii se văd, discută și se cunosc dincolo de ecran.",
    },
    {
      kicker: "Săptămânal",
      title: "Call-uri video",
      text: "Call-uri video în fiecare săptămână, ca legătura dintre membri să nu se oprească între întâlniri.",
    },
    {
      kicker: "Permanent",
      title: "Networking & interacțiune",
      text: "Contact direct cu ceilalți membri: idei, recomandări și conversații între oameni care se cunosc.",
    },
  ],
};

export interface Testimonial {
  quote: string;
  name: string;
  role?: string;
  /** Path in /public. Only with the person's written permission. */
  photo?: string;
  /** Must be true before the testimonial is published. */
  permissionConfirmed: boolean;
}

/** No testimonials have been supplied yet. Add only real, authorized ones. */
export const testimonials: Testimonial[] = [];

export function publishedTestimonials(): Testimonial[] {
  return testimonials.filter((t) => t.permissionConfirmed);
}

export const merch = {
  title: "G33 Merch",
  status: "coming-soon" as "coming-soon" | "available",
  intro:
    "Piese gândite pentru membrii comunității. Lansarea va fi anunțată în comunitate.",
  items: [
    { name: "Șapcă", image: "/images/merch-cap.jpg" },
    { name: "Tricou", image: "/images/merch-tshirt.jpg" },
    { name: "Cană", image: null },
    { name: "Agendă", image: null },
    { name: "Instrumente de scris", image: null },
  ] as { name: string; image: string | null }[],
};

export interface FaqItem {
  q: string;
  a: string;
}

export const faq: FaqItem[] = [
  {
    q: "Ce este G33?",
    a: "G33 (GRUPAREA 33) este o comunitate privată centrată pe networking, întâlniri și interacțiune directă între membri selectați. Nu este un curs și nu este un simplu grup de Discord.",
  },
  {
    q: "Pentru cine este comunitatea?",
    a: "Pentru oameni care construiesc ceva și vor să cunoască alți oameni implicați: antreprenori, profesioniști și persoane ambițioase, deschise să contribuie la comunitate.",
  },
  {
    q: "Cum funcționează procesul de aplicare?",
    a: "Completezi formularul de aplicare de pe această pagină. Aplicația ajunge la echipa G33, care o analizează individual.",
  },
  {
    q: "Ce se întâmplă după ce trimit aplicația?",
    a: "Aplicația este analizată de echipă. Dacă este acceptată, vei fi contactat cu pașii următori, inclusiv un link securizat de plată. Trimiterea aplicației nu garantează acceptarea în comunitate.",
  },
  {
    q: "Cum sunt organizate întâlnirile?",
    a: "Comunitatea are o întâlnire fizică pe lună și call-uri video săptămânale. Detaliile fiecărei întâlniri sunt comunicate membrilor.",
  },
  {
    q: "Ce planuri de membru sunt disponibile?",
    a: "Planurile disponibile sunt afișate în secțiunea „Planuri”. Termenii completi ai fiecărui plan sunt comunicați înainte de plată.",
  },
  {
    q: "Cum se face plata?",
    a: "Plata se face online, prin procesatorul de plăți Stripe, și doar după ce aplicația ta a fost acceptată. Site-ul G33 nu colectează și nu stochează datele cardului tău.",
  },
  {
    q: "Care sunt condițiile de anulare și rambursare?",
    a: "Condițiile de anulare și rambursare sunt în curs de finalizare și vor fi publicate în pagina „Politica de anulare și rambursare” înainte de deschiderea plăților. Drepturile tale legale de consumator nu sunt afectate.",
  },
  {
    q: "Cum pot contacta echipa?",
    a: `Ne poți suna la ${company.phoneDisplay}. Datele complete de contact sunt în pagina de contact.`,
  },
];
