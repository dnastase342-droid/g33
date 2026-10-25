"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getPlan, type PlanId } from "@/config/plans";
import { LIMITS, applicationFieldsSchema, fieldErrors } from "@/lib/validation/application";
import { SELECT_PLAN_EVENT } from "./events";

type Status = "idle" | "submitting" | "success" | "error";

interface Values {
  fullName: string;
  email: string;
  phone: string;
}

const initial: Values = { fullName: "", email: "", phone: "" };

export const SUCCESS_MESSAGE =
  "Aplicația ta a fost trimisă cu succes. Echipa G33 o va analiza. Trimiterea aplicației nu garantează acceptarea în comunitate.";

export function ApplicationForm({ embedded = false, onSuccess }: { embedded?: boolean; onSuccess?: () => void } = {}) {
  const [values, setValues] = useState<Values>(initial);
  // Plan chosen by opening the form from a plan card (not a visible field).
  const [plan, setPlan] = useState<PlanId | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const submissionKey = useRef("");
  const startedAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    submissionKey.current = crypto.randomUUID();
    startedAt.current = Date.now();
    const onSelect = (e: Event) => setPlan((e as CustomEvent<PlanId | undefined>).detail);
    window.addEventListener(SELECT_PLAN_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_PLAN_EVENT, onSelect);
  }, []);

  const set = (key: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  function focusFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs).find((k) => errs[k]);
    if (!first) return;
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "submitting") return; // duplicate-submission guard

    const parsed = applicationFieldsSchema.safeParse({ ...values, preferredPlan: plan });
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      setStatus("error");
      setMessage("Te rugăm să corectezi câmpurile marcate.");
      focusFirstError(errs);
      return;
    }

    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          preferredPlan: plan,
          submissionKey: submissionKey.current,
          startedAt: startedAt.current,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; errors?: Record<string, string> };
      if (res.ok && data.ok) {
        setStatus("success");
        onSuccess?.();
        setValues(initial);
        submissionKey.current = crypto.randomUUID();
        requestAnimationFrame(() => statusRef.current?.focus());
        return;
      }
      if (data.errors) {
        setErrors(data.errors);
        focusFirstError(data.errors);
      }
      setStatus("error");
      setMessage(data.message ?? "Aplicația nu a putut fi trimisă. Te rugăm să încerci din nou.");
    } catch {
      setStatus("error");
      setMessage("Nu am putut contacta serverul. Verifică conexiunea și încearcă din nou — datele completate au rămas în formular.");
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  if (status === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="card p-8 text-center outline-none md:p-12">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-volt text-2xl text-ink shadow-[0_0_40px_rgba(245,228,0,0.5)]" aria-hidden>
          ✓
        </div>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed">{SUCCESS_MESSAGE}</p>
      </div>
    );
  }

  const busy = status === "submitting";
  const err = (k: string) => errors[k] || undefined;
  const planName = plan ? getPlan(plan)?.name : undefined;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className={embedded ? "relative" : "card relative p-6 md:p-10"} aria-describedby="form-note">
      <p id="form-note" className="text-sm text-muted">
        Lasă-ne datele de contact. Echipa G33 analizează fiecare aplicație.{" "}
        {planName && (
          <>
            Plan ales: <span className="font-semibold text-fg">{planName}</span>.
          </>
        )}
      </p>

      <div className="mt-6 grid gap-5">
        <Field id="fullName" label="Nume complet" error={err("fullName")}>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            maxLength={LIMITS.fullName}
            className="field"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            aria-invalid={!!err("fullName")}
            aria-describedby={err("fullName") ? "fullName-error" : undefined}
            required
          />
        </Field>
        <Field id="email" label="Adresă de email" error={err("email")}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={LIMITS.email}
            className="field"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={!!err("email")}
            aria-describedby={err("email") ? "email-error" : undefined}
            required
          />
        </Field>
        <Field id="phone" label="Număr de telefon" error={err("phone")} hint="Ex.: 07xx xxx xxx sau +40 7xx xxx xxx">
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={LIMITS.phone}
            className="field"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={!!err("phone")}
            aria-describedby={err("phone") ? "phone-error" : "phone-hint"}
            required
          />
        </Field>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-subtle">
        Folosim aceste date doar pentru a analiza aplicația și a te contacta în legătură cu ea. Detalii în{" "}
        <Link href="/politica-de-confidentialitate" className="text-volt underline underline-offset-4" target="_blank">
          Politica de confidențialitate
        </Link>
        .
      </p>

      <div ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {status === "error" && message && (
          <p role="alert" className="mt-5 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {message}
          </p>
        )}
      </div>

      <button type="submit" disabled={busy} aria-disabled={busy} className="btn btn-primary mt-6 w-full">
        {busy ? (
          <>
            <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
            Se trimite…
          </>
        ) : (
          "Trimite aplicația"
        )}
      </button>
    </form>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} <span className="text-volt">*</span>
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
