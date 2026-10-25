import type { ReactNode } from "react";
import { legal } from "@/config/site";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="container-g max-w-3xl py-16 md:py-24">
      <p className="eyebrow">Informații legale</p>
      <h1 className="h-section mt-5">{title}</h1>
      <p className="mt-4 text-sm text-subtle">Ultima actualizare: {new Date(legal.lastUpdated).toLocaleDateString("ro-RO", { dateStyle: "long" })}</p>
      {!legal.reviewed && <DraftNotice />}
      <div className="prose-legal mt-10">{children}</div>
    </article>
  );
}

export function DraftNotice() {
  return (
    <div role="note" className="mt-8 rounded-2xl border border-volt/40 bg-volt/5 p-5 text-sm leading-relaxed text-volt-soft">
      <strong className="text-volt">Document în lucru.</strong> Acest text este o structură preliminară, nu a fost verificat juridic și nu
      este forma finală. Informațiile marcate „de completat” urmează să fie furnizate și confirmate înainte de lansarea plăților.
    </div>
  );
}

/** Visible marker for information that has not been supplied yet. */
export function Todo({ children }: { children: ReactNode }) {
  return <span className="todo">de completat: {children}</span>;
}
