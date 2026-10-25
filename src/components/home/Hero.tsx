import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { VideoEmbed } from "@/components/VideoEmbed";
import { membership } from "@/config/content";
import { brand, media } from "@/config/site";
import { CounterView, MemberCounter } from "./MemberCounter";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="grain relative isolate -mt-[var(--header-h)] overflow-hidden pt-[var(--header-h)]">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <Image src="/images/hero-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/70 to-ink" />
        <div className="glow left-1/2 top-[18%] h-[340px] w-[720px] -translate-x-1/2 animate-pulse-glow" />
      </div>

      <div className="container-g flex flex-col items-center pb-20 pt-16 text-center sm:pt-24 md:pb-28">
        <p className="eyebrow animate-rise">Comunitate privată · Acces pe bază de aplicație</p>

        <h1 id="hero-title" className="h-display mt-7 max-w-5xl animate-rise text-[2.6rem] sm:text-6xl lg:text-[5.25rem] [animation-delay:80ms]">
          Nu e un curs.
          <br />
          <span className="font-serif text-[1.08em] font-normal italic tracking-[-0.01em] text-volt [text-shadow:0_0_40px_rgba(245,228,0,0.35)]">
            Nu e un simplu grup de Discord.
          </span>
        </h1>

        <p className="lead mt-7 max-w-2xl animate-rise [animation-delay:160ms]">
          {brand.shortName} este o comunitate privată construită în jurul networking-ului, al întâlnirilor față în față și al
          interacțiunii reale dintre membri selectați.
        </p>

        <div className="mt-9 flex w-full animate-rise flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row [animation-delay:240ms]">
          <Link href="#aplica" className="btn btn-primary w-full sm:w-auto">
            Aplică pentru G33
            <span aria-hidden>→</span>
          </Link>
          <Link href="#despre" className="btn btn-ghost w-full sm:w-auto">
            Descoperă comunitatea
          </Link>
        </div>

        <div className="relative mt-16 w-full max-w-4xl animate-rise [animation-delay:320ms]">
          <div className="glow -inset-x-10 -bottom-10 top-10 opacity-60" aria-hidden />
          <VideoEmbed
            url={media.vslUrl}
            poster={media.vslPoster}
            title="Prezentare GRUPAREA 33"
            devLabel="VSL neconfigurat — setează NEXT_PUBLIC_VSL_URL"
            priority
          />
        </div>

        <div className="mt-10 flex w-full justify-center">
          <Suspense fallback={<CounterView confirmed={membership.initialMemberCount} max={membership.maxMembers} pending />}>
            <MemberCounter />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
