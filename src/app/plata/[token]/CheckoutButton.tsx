"use client";

import { useState } from "react";

export function CheckoutButton({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; message?: string };
      if (res.ok && data.ok && data.url && data.url.startsWith("https://checkout.stripe.com/")) {
        window.location.assign(data.url);
        return;
      }
      setError(data.message ?? "Plata nu a putut fi inițiată.");
    } catch {
      setError("Nu am putut contacta serverul. Încearcă din nou.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-8">
      <button type="button" onClick={go} disabled={busy} className="btn btn-primary w-full sm:w-auto">
        {busy ? "Se deschide pagina de plată…" : "Continuă către plata securizată"}
      </button>
      <div aria-live="polite">
        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
