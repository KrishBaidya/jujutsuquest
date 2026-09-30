import Link from "next/link";
import { ViewTransition } from "react";
import { cn } from "@/lib/utils";
import { GRADES, type GradeKey } from "@/lib/grades";

/* ── Page frame ─────────────────────────────────────────────── */

/** Wraps a page's content so route changes animate. Use in pages, not layouts. */
export function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ViewTransition enter="ink-cut" exit="ink-cut" default="none">
      <main className={cn("mx-auto w-full max-w-[1180px] px-4 pb-10 pt-5 sm:px-6 lg:px-10 lg:pt-10", className)}>
        {children}
      </main>
    </ViewTransition>
  );
}

/**
 * Screen title: a huge brush kanji bleeding behind a heavy title-card heading.
 * `kanji` is decorative; `title` is the accessible heading.
 */
export function PageHead({
  kanji,
  kicker,
  title,
  sub,
  right,
}: {
  kanji: string;
  kicker: string;
  title: string;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="relative mb-6 flex items-end justify-between gap-4 lg:mb-9">
      <span
        aria-hidden
        className="kanji pointer-events-none absolute -left-2 -top-7 select-none text-[120px] text-blood/10 lg:-top-12 lg:text-[180px]"
      >
        {kanji}
      </span>
      <div className="relative min-w-0">
        <p className="kicker mb-2 flex items-center gap-2">
          <span className="inline-block h-px w-6 bg-blood" />
          {kicker}
        </p>
        <h1 className="font-display text-[34px] leading-[0.95] tracking-tight lg:text-[52px]">{title}</h1>
        {sub && <div className="mt-2 text-[14px] text-fg-muted lg:text-[15px]">{sub}</div>}
      </div>
      {right && <div className="relative flex-none">{right}</div>}
    </header>
  );
}

const NUMERALS = ["壱", "弐", "参", "肆", "伍", "陸", "漆", "捌"];

/** Numbered section heading: 壱 · Title ——— right. */
export function Section({
  n,
  title,
  right,
  children,
  className,
}: {
  n: number;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-9", className)}>
      <div className="mb-4 flex items-center gap-3">
        <span className="kanji text-[22px] text-blood">{NUMERALS[n - 1] ?? n}</span>
        <h2 className="font-display text-[17px] tracking-wide lg:text-[19px]">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-ink-500 to-transparent" />
        {right}
      </div>
      {children}
    </section>
  );
}

/* ── Buttons ────────────────────────────────────────────────── */

type BtnVariant = "blood" | "bone" | "ghost" | "cursed";
type BtnSize = "sm" | "md" | "lg";

const VARIANT: Record<BtnVariant, string> = {
  blood: "bg-blood text-bone hover:bg-blood-bright shadow-[0_8px_24px_-8px_rgb(215_38_46/0.7)]",
  bone: "paper text-paper-ink hover:brightness-105",
  ghost: "border border-ink-500 bg-ink-800/70 text-fg hover:border-fg-faint hover:bg-ink-700",
  cursed: "bg-cursed text-white hover:brightness-110 shadow-[0_8px_28px_-8px_rgb(139_77_255/0.8)]",
};
const SIZE: Record<BtnSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-14 px-6 text-[17px] gap-2.5",
};

export function btnClass(variant: BtnVariant = "blood", size: BtnSize = "md", className?: string) {
  return cn(
    "btn-cut inline-flex select-none items-center whitespace-nowrap justify-center font-display tracking-wide transition-[filter,background-color,transform] active:scale-[0.98] disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

export function Btn({
  href,
  variant,
  size,
  className,
  children,
  ...rest
}: {
  href?: string;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  const cls = btnClass(variant, size, className);
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={rest["aria-label"]}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ── Grade marks ────────────────────────────────────────────── */

/** Square grade seal with its kanji, glowing in the grade colour. */
export function GradeSeal({ grade, size = 56, className }: { grade: GradeKey; size?: number; className?: string }) {
  const g = GRADES[grade];
  const long = g.kanji.length > 2;
  return (
    <span
      role="img"
      aria-label={g.label}
      className={cn("relative inline-flex flex-none items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="aura absolute inset-0 rotate-45 rounded-[3px] border bg-ink-900"
        style={{ borderColor: g.color, ["--c" as string]: g.glow }}
      />
      <span
        className="kanji relative text-center"
        style={{ color: g.color, fontSize: size * (long ? 0.26 : 0.34), lineHeight: 1.05 }}
      >
        {long ? (
          <>
            準<br />一級
          </>
        ) : (
          g.kanji
        )}
      </span>
    </span>
  );
}

/** Inline grade tag: coloured bar + kanji + label. */
export function GradeTag({ grade, className, compact }: { grade: GradeKey; className?: string; compact?: boolean }) {
  const g = GRADES[grade];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 border-l-2 bg-ink-700/80 pl-1.5 pr-2 text-[12px] font-bold",
        className,
      )}
      style={{ borderColor: g.color }}
    >
      <span className="kanji text-[13px]" style={{ color: g.color }}>
        {g.kanji}
      </span>
      {!compact && <span className="text-fg-muted">{g.label}</span>}
    </span>
  );
}

/* ── Bits ───────────────────────────────────────────────────── */

/** Red hanko stamp. */
export function Seal({ children, size = 44, className }: { children: React.ReactNode; size?: number; className?: string }) {
  return (
    <span className={cn("seal", className)} style={{ width: size, height: size, fontSize: size * 0.5 }}>
      {children}
    </span>
  );
}

/** Cursed-energy gauge. */
export function CeBar({ ratio, color = "var(--color-blood)", className }: { ratio: number; color?: string; className?: string }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className={cn("relative h-2 overflow-hidden bg-ink-600", className)} role="presentation">
      <div
        className="absolute inset-y-0 left-0 transition-[width] duration-1000 ease-[var(--ease-out-expo)]"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, transparent, ${color})`, boxShadow: `0 0 12px ${color}` }}
      />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_9px,rgb(6_6_8/0.7)_9px_11px)]" />
    </div>
  );
}

/** Initials in a grade-coloured ring. */
export function Avatar({
  initials,
  grade,
  size = 40,
  className,
}: {
  initials: string;
  grade: GradeKey;
  size?: number;
  className?: string;
}) {
  const g = GRADES[grade];
  return (
    <span
      className={cn("relative inline-flex flex-none items-center justify-center rounded-full bg-ink-700 font-display", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        boxShadow: `0 0 0 2px ${g.color}, 0 0 14px rgb(${g.glow} / 0.5)`,
      }}
    >
      {initials}
    </span>
  );
}

export function Empty({ kanji, title, children }: { kanji: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="hatch flex flex-col items-center gap-2 border border-dashed border-ink-500 px-6 py-10 text-center">
      <span className="kanji text-[44px] text-ink-400">{kanji}</span>
      <p className="font-display text-[16px]">{title}</p>
      {children && <div className="max-w-sm text-[14px] text-fg-muted">{children}</div>}
    </div>
  );
}

/** CE amount in display type, e.g. +120 呪力. */
export function Ce({ value, sign, className }: { value: number; sign?: boolean; className?: string }) {
  return (
    <span className={cn("font-display tabular-nums", className)}>
      {sign && value > 0 ? "+" : ""}
      {value.toLocaleString("en-IN")}
      <span className="ml-1 align-[0.1em] font-mono text-[0.55em] tracking-widest opacity-70">CE</span>
    </span>
  );
}
