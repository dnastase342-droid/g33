import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pagina nu a fost găsită", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="container-g flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-[7rem] font-extrabold leading-none tracking-tighter text-volt [text-shadow:0_0_60px_rgba(245,228,0,0.35)]">
        404
      </p>
      <h1 className="mt-4 font-display text-2xl font-bold">Pagina nu există.</h1>
      <p className="mt-3 max-w-md text-muted">Linkul poate fi greșit sau pagina a fost mutată.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Pagina principală
        </Link>
        <Link href="/#aplica" className="btn btn-ghost">
          Aplică pentru G33
        </Link>
      </div>
    </section>
  );
}
