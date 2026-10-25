"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Sticky header that gains a backdrop once the page is scrolled. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? "border-b border-line bg-ink/80 backdrop-blur-xl" : "border-b border-transparent bg-ink/40 backdrop-blur-sm"
      }`}
    >
      {children}
    </header>
  );
}
