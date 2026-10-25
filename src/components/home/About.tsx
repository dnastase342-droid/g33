import Image from "next/image";
import Link from "next/link";
import { about } from "@/config/content";
import { SectionHeading } from "./SectionHeading";

export function About() {
  return (
    <section id="despre" aria-labelledby="despre-title" className="relative py-24 md:py-32">
      <div className="container-g grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionHeading id="despre-title" eyebrow={about.eyebrow} title={about.title} />
          <div className="mt-6 space-y-4">
            {about.paragraphs.map((p) => (
              <p key={p} className="lead">
                {p}
              </p>
            ))}
          </div>
          <Link href="#aplica" className="btn btn-primary mt-9">
            Aplică pentru G33
          </Link>
        </div>

        <div className="relative lg:col-span-6">
          <div className="glow -right-10 top-10 h-72 w-72 opacity-50" aria-hidden />
          <figure className="relative overflow-hidden rounded-3xl border border-line">
            <Image
              src="/images/group.jpg"
              alt="Membrii comunității G33 la o întâlnire, pe o terasă"
              width={1800}
              height={1200}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="aspect-[4/3] h-auto w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
          </figure>
        </div>
      </div>

      <div className="container-g mt-16 grid gap-4 md:grid-cols-3">
        {about.pillars.map((p, i) => (
          <article key={p.title} className="card card-hover p-7">
            <p className="font-display text-sm font-bold text-volt">0{i + 1}</p>
            <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{p.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{p.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
