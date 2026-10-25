import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  // No confirmed domain (preview/staging): keep the whole site out of search engines.
  if (!site) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/plata/"] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
