"use client";

import { useEffect, useRef, useState } from "react";
import { ApplicationForm } from "./ApplicationForm";
import { OPEN_APPLY_EVENT, SELECT_PLAN_EVENT } from "./events";

const isApplyLink = (a: HTMLAnchorElement) => {
  try {
    const url = new URL(a.href, window.location.href);
    return url.origin === window.location.origin && url.hash === "#aplica";
  } catch {
    return false;
  }
};

/**
 * Application form in a modal <dialog> (native focus trap, Esc to close,
 * inert background). Any link to "#aplica" on the site opens it instead of
 * navigating, so every "Aplică pentru G33" button works on every page.
 */
export function ApplyDialog({ applicationsOpen }: { applicationsOpen: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  // Bumped after a successful submission so the next opening starts a fresh form.
  const [formKey, setFormKey] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const open = () => {
      if (dialog.open) return;
      opener.current = document.activeElement as HTMLElement | null;
      if (submitted) {
        setFormKey((k) => k + 1);
        setSubmitted(false);
      }
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (a && isApplyLink(a)) {
        e.preventDefault();
        // Generic apply link: no specific plan.
        window.dispatchEvent(new CustomEvent(SELECT_PLAN_EVENT, { detail: undefined }));
        open();
      }
    };

    // Capture phase: runs before Next's <Link> so it doesn't navigate.
    document.addEventListener("click", onClick, true);
    window.addEventListener(OPEN_APPLY_EVENT, open);
    if (window.location.hash === "#aplica") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      open();
    }
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(OPEN_APPLY_EVENT, open);
    };
  }, [submitted]);

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      id="aplica"
      aria-labelledby="aplica-title"
      onClose={() => {
        document.documentElement.style.overflow = "";
        opener.current?.focus?.();
      }}
      onClick={(e) => {
        // Click on the backdrop (outside the panel) closes the dialog.
        if (e.target === e.currentTarget) close();
      }}
      className="apply-dialog m-auto max-h-[100dvh] w-full max-w-xl overflow-y-auto overflow-x-clip bg-transparent p-0 text-fg backdrop:bg-black/75 backdrop:backdrop-blur-sm sm:max-h-[calc(100dvh-3rem)] sm:p-4"
    >
      <div className="relative rounded-none border-line bg-ink-2 shadow-[0_40px_120px_-30px_rgba(245,228,0,0.25)] sm:rounded-3xl sm:border">
        <div className="led-line absolute inset-x-10 top-0" aria-hidden />
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 md:px-8">
          <div>
            <p className="eyebrow">Aplicare</p>
            <h2 id="aplica-title" className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
              Aplică pentru <span className="font-serif font-normal italic text-volt">G33</span>
            </h2>
            <p className="mt-1 text-sm text-muted">Durează ~5 minute · Nu plătești nimic acum · Plata doar după acceptare</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Închide formularul"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line-2 text-lg text-muted transition-colors hover:border-volt/60 hover:text-volt"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-6 md:px-8 md:py-8">
          {applicationsOpen ? (
            <ApplicationForm key={formKey} embedded onSuccess={() => setSubmitted(true)} />
          ) : (
            <div className="p-4" role="status">
              <h3 className="font-display text-2xl font-bold">Aplicările sunt închise momentan</h3>
              <p className="mt-3 text-muted">
                Comunitatea G33 a atins capacitatea maximă. Revino mai târziu — vom redeschide aplicările când se eliberează locuri.
              </p>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
