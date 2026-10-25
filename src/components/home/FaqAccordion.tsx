"use client";

import { useId, useState } from "react";
import type { FaqItem } from "@/config/content";

/**
 * Accessible accordion. The answer slides down/up by animating
 * grid-template-rows 0fr ↔ 1fr (smooth height animation without measuring).
 * Answers stay in the DOM (and in the server HTML) for SEO.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;
        return (
          <div key={item.q}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-6 rounded-md py-5 text-left font-semibold transition-colors hover:text-volt-soft"
              >
                <span className="text-[1.02rem]">{item.q}</span>
                <span
                  aria-hidden
                  className={`grid size-8 shrink-0 place-items-center rounded-full border text-volt transition-[transform,border-color,box-shadow] duration-300 ${
                    isOpen ? "rotate-45 border-volt/60 shadow-[0_0_14px_rgba(245,228,0,0.35)]" : "border-line-2"
                  }`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p
                  className={`pb-6 pr-12 text-sm leading-relaxed text-muted transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen ? "translate-y-0" : "-translate-y-2"
                  }`}
                >
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
