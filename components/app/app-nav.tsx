"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, LayoutGrid, Map, Plus, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import { me } from "@/lib/mock-data";
import { CePill, Kanji } from "./primitives";
import { BACK, FORWARD } from "./transitions";

const ICONS = {
  board: LayoutGrid,
  map: Map,
  missions: Target,
  rank: Trophy,
  me: CircleUserRound,
} as const;

// Keeps the bar still while the page underneath slides.
const pinned = (name: string) =>
  ({ viewTransitionName: name, viewTransitionClass: "pinned" }) as React.CSSProperties;

const Dot = ({ on }: { on: boolean }) => (
  <span
    className={cn(
      "size-[5px] rounded-full transition-all duration-300",
      on ? "bg-cursed-300 shadow-[0_0_8px_2px_rgba(61,139,255,0.8)]" : "scale-0",
    )}
  />
);

/** Tabs to the right of the current one slide in from the right, and vice versa. */
function useDirection() {
  const pathname = usePathname();
  const current = NAV.findIndex((n) => pathname.startsWith(n.href));
  return {
    pathname,
    types: (index: number) => (current === -1 || index >= current ? FORWARD : BACK),
  };
}

export function BottomNav() {
  const { pathname, types } = useDirection();
  return (
    <nav
      aria-label="Primary"
      style={pinned("bottom-nav")}
      className="fixed inset-x-0 bottom-0 z-20 mx-auto grid h-[88px] w-full max-w-[430px] grid-cols-5 border-t border-night-700 bg-night-800 px-1.5 pb-6 pt-2 lg:hidden"
    >
      {NAV.map(({ label, href, icon }, i) => {
        const Icon = ICONS[icon];
        const on = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            transitionTypes={types(i)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 text-[13px] text-mist-500 transition-colors",
              on && "font-bold text-mist-100",
            )}
          >
            <Dot on={on} />
            <Icon
              className={cn("size-6 transition-transform duration-300", on && "-translate-y-0.5")}
              strokeWidth={1.75}
              aria-hidden
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TopNav() {
  const { pathname, types } = useDirection();
  const guest = pathname.startsWith("/onboarding");
  return (
    <header
      style={pinned("top-nav")}
      className="sticky top-0 z-[1100] hidden h-[72px] border-b border-night-700 bg-night-800 lg:flex lg:justify-center"
    >
      <div className="flex w-full max-w-[1164px] items-center gap-10 px-8">
        <Link href={guest ? "/onboarding" : "/board"} className="flex items-center gap-2.5">
          <Kanji className="text-[28px]">呪</Kanji>
          <span className="font-display text-lg font-extrabold">Cursed Mission Board</span>
        </Link>
        {!guest && (
          <>
            <nav aria-label="Primary" className="flex gap-1.5 text-[15px]">
              {NAV.map(({ label, href }, i) => {
                const on = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    transitionTypes={types(i)}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-mist-300 transition-colors hover:bg-night-700/60 hover:text-mist-100",
                      on && "bg-night-700 font-bold text-mist-100",
                    )}
                  >
                    {on && <Dot on />}
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/quests/new"
                transitionTypes={FORWARD}
                className="flex h-10 items-center gap-1.5 rounded-lg border border-night-700 px-3.5 text-[15px] font-bold transition-colors hover:bg-night-700"
              >
                <Plus className="size-4" aria-hidden />
                Create quest
              </Link>
              <CePill value={me.ce} className="h-10 bg-night-950" />
              <Link
                href="/me"
                aria-label="Your profile"
                className="flex size-10 items-center justify-center rounded-full bg-night-700 text-[13px] font-bold transition-shadow hover:shadow-[0_0_0_2px_#3D8BFF]"
              >
                {me.initials}
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
