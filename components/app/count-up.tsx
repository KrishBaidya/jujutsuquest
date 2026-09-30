"use client";

import { useEffect, useRef } from "react";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** Tweens a number up to `value` when it first becomes visible. */
export function CountUp({
  value,
  duration = 900,
  prefix = "",
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = prefix + fmt(value);
      return;
    }
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + fmt(value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        io.disconnect();
        run();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, prefix]);

  return (
    <span ref={ref} className={className}>
      {prefix + fmt(value)}
    </span>
  );
}
