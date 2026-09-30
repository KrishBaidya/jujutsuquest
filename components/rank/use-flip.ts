"use client";

import { useLayoutEffect, useRef } from "react";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * FLIP for a keyed list. Children carry `data-flip="<id>"`; whenever `order`
 * changes, rows that moved slide from their old offset to the new one, and rows
 * listed in `flash` get a brief highlight. Both are skipped for reduced motion.
 */
export function useFlip<T extends HTMLElement>(order: string, flash: ReadonlySet<string>) {
  const ref = useRef<T>(null);
  const tops = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const calm = reduced();
    const next = new Map<string, number>();
    root.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const id = el.dataset.flip!;
      const top = el.offsetTop;
      next.set(id, top);
      if (calm) return;
      const before = tops.current.get(id);
      if (before !== undefined && before !== top) {
        el.animate([{ transform: `translateY(${before - top}px)` }, { transform: "none" }], {
          duration: 480,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        });
      }
    });
    tops.current = next;
  }, [order]);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !flash.size || reduced()) return;
    root.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      if (!flash.has(el.dataset.flip!)) return;
      el.animate([{ backgroundColor: "rgba(63, 182, 139, 0.38)" }, {}], { duration: 1600, easing: "ease-out" });
    });
  }, [flash]);

  return ref;
}
