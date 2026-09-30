"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pill segmented control. Items with `href` render as links (for server-side views). */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: { value: T; label: React.ReactNode; href?: string }[];
  value: T;
  onChange?: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role={onChange ? "radiogroup" : undefined}
      aria-label={label}
      className={cn("grid gap-1 rounded-[10px] border border-ink-600 bg-ink-800 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it) => {
        const on = it.value === value;
        const cls = cn(
          "flex h-10 items-center justify-center gap-[5px] whitespace-nowrap rounded-[7px] text-[13px] text-fg-muted transition-colors hover:text-fg",
          on && "bg-bone font-bold text-paper-ink hover:text-paper-ink",
        );
        return it.href ? (
          <Link key={it.value} href={it.href} scroll={false} className={cls} aria-current={on ? "page" : undefined}>
            {it.label}
          </Link>
        ) : (
          <button
            key={it.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange?.(it.value)}
            className={cls}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-9 flex-none items-center gap-[5px] whitespace-nowrap rounded-full px-3 text-[13px] transition-colors",
        active ? "bg-bone font-bold text-paper-ink" : "border border-ink-600 bg-ink-800 text-fg-muted hover:text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Horizontal scroll track with soft edges. */
export function Scroller({
  children,
  label,
  className,
  trackClassName,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
  trackClassName?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          "scrollbar-none flex snap-x gap-3 overflow-x-auto outline-none [mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-16px),transparent)] *:snap-start",
          trackClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
