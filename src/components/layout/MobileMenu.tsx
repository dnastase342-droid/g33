"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { applyHref, type NavItem } from "@/config/navigation";

const noopSubscribe = () => () => {};

export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Portals need document.body, which only exists after hydration.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  // Rendered into <body>: the header uses backdrop-filter, which would otherwise
  // become the containing block for this fixed panel and collapse it.
  const panel = (
    <div
      id={panelId}
      ref={panelRef}
      hidden={!open}
      className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 overflow-y-auto border-t border-line bg-ink/98 backdrop-blur-xl md:hidden"
    >
      <nav aria-label="Navigație mobilă" className="container-g flex flex-col gap-2 py-8">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            className="border-b border-line py-4 font-display text-2xl font-bold tracking-tight"
          >
            {item.label}
          </Link>
        ))}
        <Link href={applyHref} onClick={close} className="btn btn-primary mt-8 w-full">
          Aplică pentru G33
        </Link>
      </nav>
    </div>
  );

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Închide meniul" : "Deschide meniul"}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-11 place-items-center rounded-full border border-line-2 bg-ink-2"
      >
        <span aria-hidden className="relative block h-3 w-5">
          <span className={`absolute left-0 top-0 h-px w-5 bg-fg transition-transform ${open ? "translate-y-1.5 rotate-45" : ""}`} />
          <span className={`absolute bottom-0 left-0 h-px w-5 bg-fg transition-transform ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
        </span>
      </button>
      {mounted && createPortal(panel, document.body)}
    </div>
  );
}
