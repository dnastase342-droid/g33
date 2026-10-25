import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Plată anulată" };

export default function CancelledPage() {
  return (
    <div className="card p-8 md:p-10">
      <p className="eyebrow">Plată</p>
      <h1 className="mt-4 font-display text-3xl font-bold">Plata nu a fost finalizată.</h1>
      <p className="mt-4 text-muted">
        Nu ți-a fost debitat nimic. Poți reveni oricând folosind același link de plată primit de la echipa G33, cât timp acesta este valabil.
      </p>
      <Link href="/" className="btn btn-ghost mt-8">
        Înapoi la pagina principală
      </Link>
    </div>
  );
}
