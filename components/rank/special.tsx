"use client";

import { Target } from "lucide-react";
import type { LeaderboardSnapshot } from "@/lib/queries/leaderboard";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { LiveBadge } from "@/components/rank/live-badge";

const fmt = (n: number) => n.toLocaleString("en-IN");

/** The four Special Grade seats, live. */
export function SpecialSeats({ initial, meId }: { initial: LeaderboardSnapshot; meId: string | null }) {
  const { snapshot: latest, live } = useLeaderboard({ all: initial }, "all");
  const { seats, challenger } = (latest ?? initial).special;
  const held = seats.filter((s) => s.holder).length;

  return (
    <section className="flex flex-col gap-5 lg:items-center lg:gap-8">
      <div className="flex flex-col gap-1 lg:max-w-[520px] lg:items-center lg:text-center">
        <h2 className="hidden items-center gap-3 font-display text-[22px] lg:flex">
          Special Grade · {held} of {seats.length} seats held
          <LiveBadge live={live} />
        </h2>
        <div className="flex items-center gap-3 lg:hidden">
          <span className="font-display text-lg">
            {held} of {seats.length} seats held
          </span>
          <LiveBadge live={live} />
        </div>
        <p className="text-[15px] leading-[1.6] text-fg-muted [text-wrap:pretty]">
          Four seats. The top four Grade 1 sorcerers on campus hold them until someone takes their place.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-[26px] gap-y-[22px] px-2 sm:px-0 lg:grid-cols-4 lg:gap-6">
        {seats.map(({ seat, holder }, i) =>
          holder ? (
            <div
              key={seat}
              className="rise flex h-[232px] flex-col items-center gap-2 rounded-[3px] bg-bone px-2.5 py-[18px] text-center text-paper-ink shadow-[inset_0_0_0_4px_#e9e0cb,inset_0_0_0_6px_#d7262e,0_0_26px_rgba(215,38,46,0.45)] lg:w-[180px]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="flex size-[38px] items-center justify-center rounded-full bg-blood kanji text-2xl text-bone">
                特
              </span>
              <span className="text-[13px] text-paper-muted">Seat {seat}</span>
              <span className="font-display text-xl leading-[1.2]">
                {holder.id === meId ? "You" : holder.name}
              </span>
              <span className="text-[13px] text-paper-muted">{holder.department}</span>
              <span className="mt-auto font-display text-xl text-blood">{fmt(holder.ce)} CE</span>
            </div>
          ) : (
            <div
              key={seat}
              className="rise flex h-[232px] flex-col items-center justify-center gap-2 rounded-[3px] border-[1.5px] border-dashed border-ink-500 p-3 text-center lg:w-[180px]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span aria-hidden className="kanji text-[32px] text-ink-500">空</span>
              <span className="text-[13px] text-fg-muted">Seat {seat}</span>
              <span className="font-display text-lg">Unclaimed</span>
              <span className="text-[13px] text-fg-faint">Reach Grade 1 to contest</span>
            </div>
          ),
        )}
      </div>
      {challenger && (
        <p className="flex items-center gap-2.5 rounded border border-dashed border-gold/50 bg-gold/10 px-3 py-2 text-[13px] ">
          <Target className="size-4 flex-none text-gold" aria-hidden />
          <span>
            <strong>Next challenger:</strong> {challenger.id === meId ? "You" : challenger.name} at {fmt(challenger.ce)} CE,{" "}
            <strong className="text-gold">{fmt(challenger.gap)} CE</strong> from a seat.
          </span>
        </p>
      )}
    </section>
  );
}
