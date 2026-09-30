"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GRADES, type GradeKey } from "@/lib/grades";

const NAV = [
  { href: "/board", kanji: "任", label: "Missions", match: ["/board", "/quests"] },
  { href: "/map", kanji: "帳", label: "The Veil", match: ["/map", "/places"] },
  { href: "/rank", kanji: "番", label: "Rankings", match: ["/rank"] },
  { href: "/me", kanji: "己", label: "Sorcerer", match: ["/me"] },
] as const;

type NavUser = { name: string; initials: string; ce: number; grade: GradeKey };

const isOn = (path: string, match: readonly string[]) => match.some((m) => path === m || path.startsWith(`${m}/`));

/** Vertical talisman rail on desktop. */
export function SideRail({ user }: { user: NavUser }) {
  const path = usePathname();
  const g = GRADES[user.grade];
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[92px] flex-col items-center border-r border-ink-600 bg-ink-900/95 py-6 backdrop-blur lg:flex">
      <Link href="/board" aria-label="Cursed Mission Board" className="group mb-8 flex flex-col items-center gap-2">
        <span className="seal size-12 text-[28px] transition-transform group-hover:rotate-[-6deg]">呪</span>
        <span className="font-mono text-[9px] tracking-[0.3em] text-fg-faint">高専</span>
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col items-center gap-2">
        {NAV.map((n) => {
          const on = isOn(path, n.match);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "group relative flex w-[68px] flex-col items-center gap-1 py-3 transition-colors",
                on ? "text-bone" : "text-fg-faint hover:text-fg",
              )}
            >
              {on && <span className="absolute inset-y-2 -left-3 w-[3px] bg-blood shadow-[0_0_12px_var(--color-blood)]" />}
              <span className={cn("kanji text-[30px] transition-transform group-hover:scale-110", on && "text-blood")}>
                {n.kanji}
              </span>
              <span className="text-[10px] font-bold tracking-wider">{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link href="/me" className="flex flex-col items-center gap-2" aria-label={`${user.name}, ${user.ce} CE`}>
        <span
          className="flex size-11 items-center justify-center rounded-full bg-ink-700 font-display text-[15px]"
          style={{ boxShadow: `0 0 0 2px ${g.color}, 0 0 16px rgb(${g.glow} / 0.5)` }}
        >
          {user.initials}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-fg-muted">{user.ce.toLocaleString("en-IN")}</span>
        <span className="kanji text-[13px]" style={{ color: g.color }}>
          {g.kanji}
        </span>
      </Link>
    </aside>
  );
}

/** Bottom bar on phones. */
export function BottomBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-600 bg-ink-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid h-[68px] max-w-md grid-cols-4">
        {NAV.map((n) => {
          const on = isOn(path, n.match);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={cn("relative flex flex-col items-center justify-center gap-0.5", on ? "text-bone" : "text-fg-faint")}
            >
              {on && <span className="absolute top-0 h-[3px] w-10 bg-blood shadow-[0_0_14px_var(--color-blood)]" />}
              <span className={cn("kanji text-[25px]", on && "text-blood")}>{n.kanji}</span>
              <span className="text-[10px] font-bold tracking-wider">{n.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Slim top strip on phones: brand + CE. */
export function TopStrip({ user }: { user: NavUser }) {
  const g = GRADES[user.grade];
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-600/60 bg-void/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
      <Link href="/board" className="flex items-center gap-2.5">
        <span className="seal size-8 text-[18px]">呪</span>
        <span className="font-display text-[13px] leading-none tracking-wide">
          CURSED
          <br />
          <span className="text-fg-muted">MISSION BOARD</span>
        </span>
      </Link>
      <Link href="/me" className="flex items-center gap-2.5">
        <span className="text-right leading-tight">
          <span className="block font-mono text-[13px] tabular-nums">{user.ce.toLocaleString("en-IN")} CE</span>
          <span className="kanji block text-[12px]" style={{ color: g.color }}>
            {g.kanji}
          </span>
        </span>
        <span
          className="flex size-9 items-center justify-center rounded-full bg-ink-700 font-display text-[13px]"
          style={{ boxShadow: `0 0 0 2px ${g.color}` }}
        >
          {user.initials}
        </span>
      </Link>
    </header>
  );
}
