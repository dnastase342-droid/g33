"use client";

import Image from "next/image";
import { useState } from "react";
import { useConsent } from "@/components/CookieConsent";
import { parseVideoUrl } from "@/lib/video";

interface Props {
  url: string | null;
  poster: string;
  title: string;
  /** Text shown in development when the URL is not configured yet. */
  devLabel: string;
  /** In production, with no URL: render the poster as a still image (true) or nothing (false). */
  stillWhenMissing?: boolean;
  priority?: boolean;
}

/**
 * Privacy-friendly video:
 *  - YouTube: click-to-load facade on youtube-nocookie.com; the iframe is only
 *    created after the visitor allows external media.
 *  - Self-hosted file: native <video> with preload="none".
 *  - Missing URL: never a broken player.
 */
export function VideoEmbed({ url, poster, title, devLabel, stillWhenMissing = true, priority }: Props) {
  const source = parseVideoUrl(url);
  const { consent, allowExternalMedia } = useConsent();
  const [playing, setPlaying] = useState(false);

  const frame = "relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-ink-2";

  if (!source) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <div className={frame}>
          <Image src={poster} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover opacity-40" priority={priority} />
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <p className="rounded-xl border border-dashed border-volt/50 bg-ink/80 px-4 py-3 text-xs text-volt-soft">
              [DEV] {devLabel}
            </p>
          </div>
        </div>
      );
    }
    if (!stillWhenMissing) return null;
    return (
      <div className={frame}>
        <Image src={poster} alt="Membri G33 la o întâlnire" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority={priority} />
      </div>
    );
  }

  if (source.kind === "file") {
    return (
      <div className={frame}>
        <video controls preload="none" poster={poster} className="h-full w-full object-cover" playsInline>
          <source src={source.src} />
          <track kind="captions" />
        </video>
      </div>
    );
  }

  const allowed = consent?.externalMedia === true;
  const showIframe = playing && allowed;

  return (
    <div className={frame}>
      {showIframe ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <>
          <Image src={poster} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority={priority} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <button
                type="button"
                onClick={() => {
                  if (!allowed) allowExternalMedia();
                  setPlaying(true);
                }}
                className="group grid size-20 place-items-center rounded-full bg-volt text-ink shadow-[0_0_60px_rgba(245,228,0,0.45)] transition-transform hover:scale-105"
                aria-label={`Redă video: ${title}`}
              >
                <svg viewBox="0 0 24 24" className="ml-1 size-8" fill="currentColor" aria-hidden>
                  <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
                </svg>
              </button>
              {!allowed && (
                <p className="max-w-xs text-xs text-muted">
                  Prin redare, videoclipul se încarcă de pe YouTube, care poate seta cookie-uri.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
