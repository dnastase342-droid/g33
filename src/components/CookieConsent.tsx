"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Minimal consent manager for the technologies actually used:
 *  - necessary: admin session cookie (only for the administrator) — always on
 *  - externalMedia: YouTube embeds (youtube-nocookie.com), loaded only after consent
 *
 * No analytics or advertising scripts are installed. If any are added later,
 * add a category here and gate them the same way.
 */

export interface ConsentState {
  version: 1;
  externalMedia: boolean;
  decidedAt: string;
}

const KEY = "g33-consent";
const EVENT = "g33-consent-change";
const OPEN_EVENT = "g33-consent-open";

function read(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

function write(externalMedia: boolean) {
  const state: ConsentState = { version: 1, externalMedia, decidedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: consent applies to this page view only */
  }
  cache = state;
  window.dispatchEvent(new Event(EVENT));
}

let cache: ConsentState | null | undefined;
function subscribe(cb: () => void) {
  const handler = () => {
    cache = read();
    cb();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
const noopSubscribe = () => () => {};

function getSnapshot() {
  if (cache === undefined) cache = read();
  return cache;
}

export function useConsent(): { consent: ConsentState | null; ready: boolean; allowExternalMedia: () => void } {
  const consent = useSyncExternalStore(subscribe, getSnapshot, () => null);
  // false during SSR/hydration, true on the client afterwards (no effect + setState needed).
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return { consent, ready, allowExternalMedia: () => write(true) };
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookiePreferences} className={className}>
      Preferințe cookie
    </button>
  );
}

export function CookieConsent({ hasOptionalMedia }: { hasOptionalMedia: boolean }) {
  const { consent, ready } = useConsent();
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      setMedia(getSnapshot()?.externalMedia ?? false);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // The banner is needed only when optional technologies are configured.
  const hasOptional = hasOptionalMedia;
  const showBanner = ready && hasOptional && !consent;

  if (!showBanner && !open) return null;

  const decide = (value: boolean) => {
    write(value);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-line-2 bg-ink-2/95 p-5 shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-6"
    >
      <h2 id="cookie-title" className="font-display text-lg font-bold">
        Preferințe cookie
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Folosim doar ce este necesar pentru funcționarea site-ului. Videoclipurile YouTube se încarcă numai dacă le permiți —
        la redare, YouTube poate seta propriile cookie-uri. Detalii în{" "}
        <Link href="/politica-cookie" className="text-volt underline underline-offset-4">
          Politica de cookie-uri
        </Link>
        .
      </p>

      {open && (
        <fieldset className="mt-4 space-y-3 text-sm">
          <legend className="sr-only">Categorii</legend>
          <label className="flex items-start gap-3 rounded-xl border border-line p-3">
            <input type="checkbox" checked disabled className="mt-1 accent-[var(--color-volt)]" />
            <span>
              <span className="font-semibold">Strict necesare</span>
              <span className="block text-muted">Mereu active. Necesare pentru securitate și funcționare.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3">
            <input
              type="checkbox"
              checked={media}
              onChange={(e) => setMedia(e.target.checked)}
              className="mt-1 accent-[var(--color-volt)]"
            />
            <span>
              <span className="font-semibold">Conținut extern (video)</span>
              <span className="block text-muted">Permite încărcarea videoclipurilor de pe YouTube.</span>
            </span>
          </label>
        </fieldset>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {open ? (
          <>
            <button type="button" className="btn btn-primary !min-h-10 text-sm" onClick={() => decide(media)}>
              Salvează preferințele
            </button>
            <button type="button" className="btn btn-ghost !min-h-10 text-sm" onClick={() => setOpen(false)}>
              Închide
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary !min-h-10 text-sm" onClick={() => decide(true)}>
              Accept tot
            </button>
            <button type="button" className="btn btn-ghost !min-h-10 text-sm" onClick={() => decide(false)}>
              Refuz opționalele
            </button>
            <button
              type="button"
              className="btn !min-h-10 text-sm text-muted hover:text-fg"
              onClick={() => {
                setMedia(false);
                setOpen(true);
              }}
            >
              Personalizează
            </button>
          </>
        )}
      </div>
    </div>
  );
}
