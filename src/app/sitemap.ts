import type { MetadataRoute } from "next";
import { getSiteUrl, legal } from "@/config/site";

/** Public, indexable pages only. Empty until the official domain is configured. */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  if (!site) return [];
  const paths = ["/", "/contact"];
  if (legal.reviewed) {
    paths.push("/termeni-si-conditii", "/politica-de-confidentialitate", "/politica-cookie", "/politica-de-anulare-si-rambursare");
  }
  return paths.map((p) => ({
    url: `${site}${p}`,
    changeFrequency: p === "/" ? "weekly" : "yearly",
    priority: p === "/" ? 1 : 0.4,
  }));
}
