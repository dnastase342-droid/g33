import Image from "next/image";
import { merch } from "@/config/content";

export function Merch() {
  const withImg = merch.items.filter((i) => i.image);
  const others = merch.items.filter((i) => !i.image);
  return (
    <section id="merch" aria-labelledby="merch-title" className="relative border-y border-line bg-ink-2 py-24 md:py-32">
      <div className="container-g grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">Coming soon</p>
          <h2 id="merch-title" className="h-section mt-5">
            {merch.title} <span className="font-serif font-normal italic text-volt">— Coming Soon</span>
          </h2>
          <p className="lead mt-5">{merch.intro}</p>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Produse pregătite">
            {merch.items.map((i) => (
              <li key={i.name} className="rounded-full border border-line-2 px-4 py-1.5 text-sm text-muted">
                {i.name}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-subtle">Produsele nu sunt încă disponibile pentru comandă.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-7">
          {withImg.map((i) => (
            <figure key={i.name} className="group relative overflow-hidden rounded-3xl border border-line bg-ink">
              <Image
                src={i.image!}
                alt={`${i.name} G33 — în curând`}
                width={1000}
                height={1000}
                sizes="(min-width: 1024px) 28vw, 50vw"
                className="aspect-square h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-xs backdrop-blur">{i.name}</figcaption>
            </figure>
          ))}
          {others.length > 0 && withImg.length === 0 && <div className="col-span-2 text-muted">În curând.</div>}
        </div>
      </div>
    </section>
  );
}
