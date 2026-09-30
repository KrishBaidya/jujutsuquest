"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Fades and lifts its content in the first time it scrolls into view. */
export function Reveal({
  children,
  index = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-in", "");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={cn("reveal", className)}
      style={{ "--i": index } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
