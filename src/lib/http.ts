import { getSiteUrl } from "@/config/site";

/**
 * Rejects cross-site browser requests to state-changing endpoints.
 * Browsers always send Origin on POST fetches; requests without it are allowed
 * only outside production (curl/tests).
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  let o: URL;
  try {
    o = new URL(origin);
  } catch {
    return false;
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && o.host === host) return true;
  const site = getSiteUrl();
  return site ? o.origin === site : false;
}

/** Base URL for redirects back to this site (prefers the configured canonical domain). */
export function baseUrlFrom(req: Request): string {
  const site = getSiteUrl();
  if (site) return site;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
