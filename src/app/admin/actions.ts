"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { endSession, isAdminConfigured, requireAdmin, startSession, verifyPassword } from "@/lib/admin/auth";
import { changeApplicationStatus, revokePaymentLinks } from "@/lib/admin/service";
import { getDb } from "@/lib/db";
import { getSiteUrl } from "@/config/site";
import { issuePaymentLink } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export interface ActionState {
  error?: string;
  ok?: string;
  link?: string;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isAdminConfigured()) return { error: "Autentificarea de administrator nu este configurată (ADMIN_PASSWORD_HASH / ADMIN_SESSION_SECRET)." };
  const h = await headers();
  const db = await getDb();
  const limit = await rateLimit(db, "admin-login", clientIp(h), 5, 15 * 60);
  if (!limit.allowed) return { error: "Prea multe încercări. Așteaptă 15 minute." };

  const password = String(formData.get("password") ?? "");
  if (password.length === 0 || password.length > 200 || !verifyPassword(password, process.env.ADMIN_PASSWORD_HASH)) {
    return { error: "Parolă incorectă." };
  }
  await startSession();
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin");
}

const ID_RE = /^G33-\d{8}-[A-Z0-9]{8}$/;

export async function changeStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("status") ?? "");
  if (!ID_RE.test(id)) return { error: "ID invalid." };
  const res = await changeApplicationStatus(id, to);
  if (!res.ok) return { error: res.error };
  revalidatePath(`/admin/aplicatii/${id}`);
  return { ok: `Status actualizat: ${to}` };
}

export async function issueLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const planId = String(formData.get("planId") ?? "");
  if (!ID_RE.test(id)) return { error: "ID invalid." };
  const res = await issuePaymentLink(id, planId, "admin");
  if (!res.ok) return { error: res.error };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = getSiteUrl() ?? `${proto}://${host}`;
  revalidatePath(`/admin/aplicatii/${id}`);
  return {
    ok: `Link generat. Expiră la ${res.expiresAt.toLocaleString("ro-RO")}. Copiază-l acum — din motive de securitate nu va mai fi afișat.`,
    link: `${base}/plata/${res.token}`,
  };
}

export async function revokeLinksAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!ID_RE.test(id)) return { error: "ID invalid." };
  await revokePaymentLinks(id);
  revalidatePath(`/admin/aplicatii/${id}`);
  return { ok: "Linkurile de plată au fost revocate." };
}
