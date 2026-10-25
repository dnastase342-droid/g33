import { publishedTestimonials } from "./content";

export interface NavItem {
  label: string;
  href: string;
}

/** Section anchors on the home page. "Recenzii" appears only when real testimonials exist. */
export function mainNav(): NavItem[] {
  const items: NavItem[] = [{ label: "Meeting-uri", href: "/#meetinguri" }];
  if (publishedTestimonials().length > 0) items.push({ label: "Recenzii", href: "/#recenzii" });
  items.push({ label: "Planuri", href: "/#planuri" }, { label: "FAQ", href: "/#faq" });
  return items;
}

export const applyHref = "/#aplica";

export const legalNav: NavItem[] = [
  { label: "Termeni și condiții", href: "/termeni-si-conditii" },
  { label: "Politica de confidențialitate", href: "/politica-de-confidentialitate" },
  { label: "Politica de cookie-uri", href: "/politica-cookie" },
  { label: "Anulare și rambursare", href: "/politica-de-anulare-si-rambursare" },
  { label: "Contact și date societate", href: "/contact" },
];
