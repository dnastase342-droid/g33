"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type MouseEvent, type ReactNode } from "react";

/**
 * Home link for the logo: plays a short zoom-in/zoom-out "pop" and then
 * glides back to the top of the main page (smooth scroll on "/", client
 * navigation + scroll elsewhere). Respects prefers-reduced-motion.
 */
export function LogoLink({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const router = useRouter();

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    // Let modified clicks (new tab, etc.) behave normally.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mark = ref.current?.querySelector<HTMLElement>("[data-logo-mark]");
    if (mark && !reduce) {
      mark.animate(
        [
          { transform: "scale(1) rotate(0deg)", filter: "drop-shadow(0 0 0 rgba(245,228,0,0))" },
          { transform: "scale(1.45) rotate(-8deg)", filter: "drop-shadow(0 0 18px rgba(245,228,0,0.85))", offset: 0.45 },
          { transform: "scale(1) rotate(0deg)", filter: "drop-shadow(0 0 0 rgba(245,228,0,0))" },
        ],
        { duration: 650, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
    }

    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    if (window.location.pathname === "/") {
      if (window.location.hash) history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, behavior });
    } else {
      router.push("/", { scroll: false });
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior }));
    }
  }

  return (
    <Link ref={ref} href="/" aria-label={label} onClick={onClick} className="rounded-md">
      {children}
    </Link>
  );
}
