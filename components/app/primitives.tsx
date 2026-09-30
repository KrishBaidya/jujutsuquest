import Link from "next/link";
import { cn } from "@/lib/utils";
import { GRADES, type GradeKey } from "@/lib/grades";
import { categoryOf, type CategoryKey } from "@/lib/mock-data";
import { CountUp } from "./count-up";

/** Small coloured dot + label, on paper or on night. */
export function GradePill({
  grade,
  tone = "paper",
  className,
}: {
  grade: GradeKey;
  tone?: "paper" | "night";
  className?: string;
}) {
  const g = GRADES[grade];
  return (
    <span
      className={cn(
        "inline-flex h-6 w-max items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-bold",
        tone === "night" ? "border-night-700 bg-night-950" : "text-sumi-900",
        className,
      )}
      style={tone === "paper" ? { borderColor: g.color } : undefined}
    >
      <span className="size-2 rounded-full" style={{ background: g.color }} />
      {g.label}
    </span>
  );
}

export function CategoryTag({ category }: { category: CategoryKey }) {
  const c = categoryOf(category);
  return (
    <span className="flex items-center gap-1 text-[13px] text-sumi-600">
      <span className="font-display text-base font-extrabold text-sumi-900" aria-hidden>
        {c.k}
      </span>
      {c.label}
    </span>
  );
}

/** A hanging scroll: wooden rod above and below a paper body. */
export function ScrollCard({
  children,
  glow,
  blur = 10,
  burning,
  pulse,
  index = 0,
  className,
  bodyClassName,
}: {
  children: React.ReactNode;
  glow?: string; // "r,g,b,a"
  blur?: number;
  burning?: boolean;
  /** Breathing aura, for the card in focus. */
  pulse?: boolean;
  /** Position in a list, staggers the unroll. */
  index?: number;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn("unroll relative", pulse && "aura", className)}
      style={
        {
          "--i": index,
          ...(glow && {
            "--glow": glow.split(",").slice(0, 3).join(","),
            filter: `drop-shadow(0 0 ${blur}px rgba(${glow}))`,
          }),
        } as React.CSSProperties
      }
    >
      <div className={cn("rod", burning && "rod-burn")} />
      <div
        className={cn(
          "paper flex flex-col gap-2 px-4 py-3.5",
          burning
            ? "shadow-[inset_0_0_0_1px_#8a4a1c,inset_0_0_22px_5px_rgba(70,30,8,0.5),inset_0_0_3px_2px_rgba(240,129,58,0.7)]"
            : "shadow-[inset_0_0_0_1px_#DDD5C3]",
          bodyClassName,
        )}
      >
        {children}
      </div>
      <div className={cn("rod", burning && "rod-burn")} />
    </div>
  );
}

export function SealedCard({ label = "Reach Semi-Grade 1 to unseal" }: { label?: string }) {
  return (
    <div className="unroll relative">
      <div className="rod rod-sealed" />
      <div className="sealed-paper relative flex min-h-[104px] flex-col justify-center gap-1.5 px-[18px] py-4 text-sumi-900">
        <span className="font-display text-[28px] font-extrabold leading-none text-sumi-600">???</span>
        <span className="flex max-w-[calc(100%-90px)] items-center gap-1.5 text-[13px] font-bold">
          <LockGlyph />
          {label}
        </span>
        <div className="absolute -bottom-2 -top-2 right-10 flex w-10 rotate-[4deg] flex-col items-center justify-center gap-0.5 bg-washi-100 shadow-[inset_0_0_0_1px_#4A3426]">
          <span className="font-display text-xl font-extrabold leading-none text-seal-600">封</span>
          <span className="font-display text-[15px] font-extrabold leading-none">印</span>
        </div>
      </div>
      <div className="rod rod-sealed" />
    </div>
  );
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

type ActionProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  size?: "lg" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  /** Direction of the page transition when `href` is set. */
  back?: boolean;
};

/** Primary / secondary action. 48 px minimum height, dips 1 px when pressed. */
export function Action({
  children,
  href,
  onClick,
  variant = "primary",
  size = "lg",
  disabled,
  type = "button",
  className,
  back,
}: ActionProps) {
  const cls = cn(
    "flex min-h-12 items-center justify-center gap-2 rounded-lg font-bold transition-[transform,background-color,box-shadow] active:translate-y-px",
    size === "lg" ? "h-14 text-[17px]" : "h-[52px] text-[15px]",
    variant === "primary"
      ? "bg-cursed-500 text-night-950 hover:bg-[#62a2ff] hover:shadow-[0_6px_24px_rgba(61,139,255,0.45)]"
      : "border border-night-700 text-mist-100 hover:bg-night-800",
    disabled && "pointer-events-none bg-night-700 text-mist-500",
    className,
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls} transitionTypes={[back ? "nav-back" : "nav-forward"]}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
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
        "flex h-9 flex-none items-center gap-[5px] rounded-full px-3 text-[13px]",
        active ? "bg-washi-100 font-bold text-sumi-900" : "border border-night-700 bg-night-800",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Kanji({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn("font-display font-extrabold", className)} aria-hidden>
      {children}
    </span>
  );
}

export function CePill({ value, className }: { value: number | string; className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-night-700 bg-night-800 px-3",
        className,
      )}
    >
      <Kanji className="text-[15px] text-cursed-300">呪</Kanji>
      <span className="font-display text-[15px] font-extrabold">
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </span>
      <span className="text-[13px] text-mist-300">CE</span>
    </span>
  );
}

export function PageHeader({
  kanji,
  title,
  subtitle,
  right,
}: {
  kanji: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top)+16px)] lg:px-0 lg:pt-0">
      <div className="flex items-center gap-2.5 lg:gap-3.5">
        <Kanji className="brush text-[34px] leading-none lg:text-[48px]">{kanji}</Kanji>
        <div className="flex flex-col">
          <h1 className="whitespace-nowrap font-display text-2xl font-extrabold leading-[1.1] lg:text-[28px]">{title}</h1>
          {subtitle && <span className="text-[13px] text-mist-300 lg:text-[15px]">{subtitle}</span>}
        </div>
      </div>
      {right}
    </header>
  );
}

/** Two-way segmented control rendered as links (URL state) or buttons. */
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
      className={cn("grid gap-1 rounded-[10px] bg-night-800 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it) => {
        const on = it.value === value;
        const cls = cn(
          "flex h-10 items-center justify-center gap-[5px] rounded-[7px] text-[13px] text-mist-300 transition-colors",
          on && "bg-mist-100 font-bold text-night-900",
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

export function CeGauge({
  value,
  max,
  tone = "night",
  className,
}: {
  value: number;
  max: number;
  tone?: "night" | "paper";
  className?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label="Cursed energy"
      className={cn(
        "overflow-hidden rounded-full",
        tone === "night" ? "h-3 bg-night-700" : "h-2.5 bg-washi-500",
        className,
      )}
    >
      <div
        className={cn(
          "gauge-fill h-full rounded-full bg-gradient-to-r from-azure-500 to-cursed-500",
          tone === "night" && "shadow-[0_0_12px_rgba(61,139,255,0.8)]",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
