import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export { hashPassword, verifyPassword } from "./password";

/**
 * Single-administrator authentication.
 *
 * - ADMIN_PASSWORD_HASH: "scrypt$<saltB64>$<hashB64>" (generate with `npm run admin:hash`)
 * - ADMIN_SESSION_SECRET: ≥32 random characters, used to sign the session cookie
 *
 * The session cookie is httpOnly, Secure (in production), SameSite=Strict and
 * expires after 8 hours. All admin pages and actions call `requireAdmin()`.
 */

export const SESSION_COOKIE = "g33_admin";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32);
}

function sign(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET missing or too short");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionValue(now = Date.now()): string {
  const exp = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = `${exp}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionValue(value: string | undefined, now = Date.now()): boolean {
  if (!value || !isAdminConfigured()) return false;
  const lastDot = value.lastIndexOf(".");
  if (lastDot <= 0) return false;
  const payload = value.slice(0, lastDot);
  const sig = value.slice(lastDot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const exp = Number(payload.split(".")[0]);
  return Number.isFinite(exp) && exp * 1000 > now;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionValue(store.get(SESSION_COOKIE)?.value);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new UnauthorizedError();
}

export async function startSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
