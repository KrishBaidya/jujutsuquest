"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Edge = "none" | "left" | "right" | "both";

/** Horizontal snap scroller with edge fades and, on desktop, arrow buttons. */
export function Scroller({
  children,
  label,
  className,
  trackClassName,
  arrows = true,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
  trackClassName?: string;
  arrows?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState<Edge>("none");

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const left = el.scrollLeft > 4;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setEdge(left && right ? "both" : left ? "left" : right ? "right" : "none");
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, []);

  const nudge = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className={cn("relative", className)}>
      <div
        ref={track}
        role="region"
        aria-label={label}
        tabIndex={0}
        data-fade={edge}
        className={cn("scroller gap-3 outline-none", trackClassName)}
      >
        {children}
      </div>
      {arrows && (edge === "left" || edge === "both") && (
        <ArrowButton side="left" onClick={() => nudge(-1)} />
      )}
      {arrows && (edge === "right" || edge === "both") && (
        <ArrowButton side="right" onClick={() => nudge(1)} />
      )}
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Scroll back" : "Scroll forward"}
      className={cn(
        "absolute top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-night-600 bg-night-800 text-mist-100 shadow-lg hover:bg-night-700 lg:flex",
        side === "left" ? "-left-3" : "-right-3",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
