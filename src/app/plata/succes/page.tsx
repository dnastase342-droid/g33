import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Plată înregistrată" };

/**
 * The browser redirect is NOT proof of payment. This page only reports what
 * the server has recorded from verified Stripe webhooks.
 */
export default function SuccessPage({ searchParams }: PageProps<"/plata/succes">) {
  return (
    <Suspense fallback={<p className="text-muted">Se verifică plata…</p>}>
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SuccessContent({ searchParams }: { searchParams: PageProps<"/plata/succes">["searchParams"] }) {
  const sp = await searchParams;
  const sessionId = typeof sp.session_id === "string" && /^cs_[A-Za-z0-9_]{10,200}$/.test(sp.session_id) ? sp.session_id : null;

  let state: "paid" | "pending" | "unknown" = "unknown";
  if (sessionId) {
    try {
      const db = await getDb();
      const rows = await db.query<{ status: string }>("SELECT status FROM payments WHERE stripe_checkout_session_id = $1", [sessionId]);
      state = rows[0]?.status === "paid" ? "paid" : rows[0] ? "pending" : "unknown";
    } catch {
      state = "unknown";
    }
  }

  return (
    <div className="card p-8 md:p-10">
      <p className="eyebrow">Plată</p>
      {state === "paid" ? (
        <>
          <h1 className="mt-4 font-display text-3xl font-bold">Plata a fost confirmată.</h1>
          <p className="mt-4 text-muted">
            Mulțumim! Plata ta a fost confirmată de Stripe. Echipa G33 te va contacta cu pașii de acces în comunitate.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-4 font-display text-3xl font-bold">Plata este în curs de confirmare.</h1>
          <p className="mt-4 text-muted">
            Am primit întoarcerea ta de pe pagina de plată. Confirmarea finală vine direct de la Stripe și poate dura câteva minute. Vei
            fi contactat de echipa G33 după confirmare. Reîncarcă pagina pentru a verifica din nou.
          </p>
        </>
      )}
      <Link href="/" className="btn btn-ghost mt-8">
        Înapoi la pagina principală
      </Link>
    </div>
  );
}
