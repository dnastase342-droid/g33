import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { planIds } from "@/config/plans";

/**
 * The application form collects only name, email and phone (data
 * minimisation). The plan is recorded only when the visitor opened the form
 * from a specific plan card; it is never a visible field.
 */

export const LIMITS = {
  fullName: 120,
  email: 254,
  phone: 30,
} as const;

/** Normalizes a phone number to E.164 (default country RO). Returns null if invalid. */
export function normalizePhone(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), "RO");
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number; // E.164, e.g. +40752515601
}

export const applicationFieldsSchema = z.object({
  fullName: z
    .string({ error: "Te rugăm să completezi numele complet." })
    .transform((s) => s.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(3, "Te rugăm să completezi numele complet.")
        .max(LIMITS.fullName, "Numele este prea lung."),
    ),
  email: z
    .string({ error: "Te rugăm să completezi adresa de email." })
    .trim()
    .toLowerCase()
    .min(1, "Te rugăm să completezi adresa de email.")
    .max(LIMITS.email, "Adresa de email este prea lungă.")
    .pipe(z.email("Adresa de email nu este validă.")),
  phone: z
    .string({ error: "Te rugăm să completezi numărul de telefon." })
    .trim()
    .min(1, "Te rugăm să completezi numărul de telefon.")
    .max(LIMITS.phone, "Numărul de telefon nu este valid.")
    .transform((v, ctx) => {
      const n = normalizePhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "Numărul de telefon nu este valid." });
        return z.NEVER;
      }
      return n;
    }),
  /** Set only when the form was opened from a plan card. */
  preferredPlan: z.enum(planIds).optional(),
});

/** Full request body (fields + anti-spam + idempotency metadata). */
export const applicationRequestSchema = applicationFieldsSchema.extend({
  /** Client-generated UUID, stable across retries of the same submission. */
  submissionKey: z.uuid("Cerere invalidă."),
  /** Honeypot — must be empty. */
  website: z.string().max(0).optional().default(""),
  /** Epoch ms when the form was rendered (anti-bot timing check). */
  startedAt: z.number().int().positive(),
});

export type ApplicationInput = z.input<typeof applicationRequestSchema>;
export type ApplicationData = z.output<typeof applicationFieldsSchema>;
export type ApplicationRequest = z.output<typeof applicationRequestSchema>;

/** Flattens zod errors to `{ field: firstMessage }`. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
