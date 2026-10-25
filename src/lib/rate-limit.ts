import "server-only";
import { createHash } from "node:crypto";
import type { Queryable } from "./db";

/**
 * Fixed-window rate limiter stored in Postgres, so it works across server
 * instances (unlike an in-memory map on serverless). Keys are hashed so no
 * raw IP addresses are persisted.
 */
export async function rateLimit(
  db: Queryable,
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `${bucket}:${hashIdentifier(identifier)}`;
  const rows = await db.query<{ count: number }>(
    `INSERT INTO rate_limits (key, count, window_start) VALUES ($1, 1, now())
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN now() ELSE rate_limits.window_start END
     RETURNING count`,
    [key, windowSeconds],
  );
  const count = Number(rows[0]?.count ?? 1);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export function hashIdentifier(identifier: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.ADMIN_SESSION_SECRET ?? "g33";
  return createHash("sha256").update(`${salt}:${identifier}`).digest("hex").slice(0, 32);
}

/** Best-effort client IP from proxy headers (Vercel / common reverse proxies). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
