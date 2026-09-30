"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, LayoutGrid, Map, Plus, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import { me } from "@/lib/mock-data";
import { CePill, Kanji } from "./primitives";

const ICONS = {
  board: LayoutGrid,
  map: Map,
  missions: Target,
  rank: Trophy,
  me: CircleUserRound,
} as const;

const Dot = ({ on }: { on: boolean }) => (
  <span
    className={cn(
      "size-[5px] rounded-full",
      on && "bg-cursed-300 shadow-[0_0_8px_2px_rgba(122,92,255,0.8)]",
    )}
  />
);

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto grid h-[88px] w-full max-w-[430px] grid-cols-5 border-t border-night-700 bg-night-800 px-1.5 pb-6 pt-2 lg:hidden"
    >
      {NAV.map(({ label, href, icon }) => {
        const Icon = ICONS[icon];
        const on = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 text-[13px] text-mist-500",
              on && "font-bold text-mist-100",
            )}
          >
            <Dot on={on} />
            <Icon className="size-6" strokeWidth={1.75} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 hidden h-[72px] border-b border-night-700 bg-night-800 lg:flex lg:justify-center">
      <div className="flex w-full max-w-[1100px] items-center gap-10">
        <Link href="/board" className="flex items-center gap-2.5">
          <Kanji className="text-[28px]">呪</Kanji>
          <span className="font-display text-lg font-extrabold">Cursed Mission Board</span>
        </Link>
        <nav aria-label="Primary" className="flex gap-1.5 text-[15px]">
          {NAV.map(({ label, href }) => {
            const on = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-mist-300 hover:text-mist-100",
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
            className="flex h-10 items-center gap-1.5 rounded-lg border border-night-700 px-3.5 text-[15px] font-bold hover:bg-night-700"
          >
            <Plus className="size-4" aria-hidden />
            Create quest
          </Link>
          <CePill value={me.ce} className="h-10 bg-night-950" />
          <Link
            href="/me"
            aria-label="Your profile"
            className="flex size-10 items-center justify-center rounded-full bg-night-700 text-[13px] font-bold"
          >
            {me.initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
