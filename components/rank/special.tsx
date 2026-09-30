"use client";

import { Target } from "lucide-react";
import type { LeaderboardSnapshot } from "@/lib/queries/leaderboard";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { Kanji } from "@/components/app/primitives";
import { LiveBadge } from "@/components/rank/live-badge";

const fmt = (n: number) => n.toLocaleString("en-US");

/** The four Special Grade seats, live. */
export function SpecialSeats({ initial, meId }: { initial: LeaderboardSnapshot; meId: string | null }) {
  const { snapshot: latest, live } = useLeaderboard({ all: initial }, "all");
  const { seats, challenger } = (latest ?? initial).special;
  const held = seats.filter((s) => s.holder).length;

  return (
    <section className="flex flex-col gap-5 lg:items-center lg:gap-8">
      <div className="mx-6 flex flex-col gap-1 lg:mx-0 lg:max-w-[520px] lg:items-center lg:text-center">
        <h2 className="hidden items-center gap-3 font-display text-[22px] font-extrabold lg:flex">
          Special Grade · {held} of {seats.length} seats held
          <LiveBadge live={live} />
        </h2>
        <div className="flex items-center gap-3 lg:hidden">
          <span className="font-display text-lg font-extrabold">
            {held} of {seats.length} seats held
          </span>
          <LiveBadge live={live} />
        </div>
        <p className="text-[15px] leading-[1.6] text-mist-300 [text-wrap:pretty]">
          Four seats. The top four Grade 1 sorcerers on campus hold them until someone takes their place.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-[26px] gap-y-[22px] px-7 lg:grid-cols-4 lg:gap-6 lg:px-0">
        {seats.map(({ seat, holder }, i) =>
          holder ? (
            <div
              key={seat}
              className="rise-in flex h-[232px] flex-col items-center gap-2 rounded-[3px] bg-washi-100 px-2.5 py-[18px] text-center text-sumi-900 shadow-[inset_0_0_0_4px_#EFE9DC,inset_0_0_0_6px_#D8392B,0_0_26px_rgba(229,50,45,0.45)] lg:w-[180px]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="flex size-[38px] items-center justify-center rounded-full bg-seal-600 font-display text-xl font-extrabold text-washi-100">
                特
              </span>
              <span className="text-[13px] text-sumi-600">Seat {seat}</span>
              <span className="font-display text-xl font-extrabold leading-[1.2]">
                {holder.id === meId ? "You" : holder.name}
              </span>
              <span className="text-[13px] text-sumi-600">{holder.department}</span>
              <span className="mt-auto font-display text-xl font-extrabold text-seal-600">{fmt(holder.ce)} CE</span>
            </div>
          ) : (
            <div
              key={seat}
              className="rise-in flex h-[232px] flex-col items-center justify-center gap-2 rounded-[3px] border-[1.5px] border-dashed border-night-600 p-3 text-center lg:w-[180px]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <Kanji className="text-[32px] text-night-600">空</Kanji>
              <span className="text-[13px] text-mist-300">Seat {seat}</span>
              <span className="font-display text-lg font-extrabold">Unclaimed</span>
              <span className="text-[13px] text-mist-500">Reach Grade 1 to contest</span>
            </div>
          ),
        )}
      </div>
      {challenger && (
        <p className="mx-5 mb-8 flex items-center gap-2.5 rounded border border-dashed border-gold-400/50 bg-gold-400/10 px-3 py-2 text-[13px] lg:mx-0 lg:mb-0">
          <Target className="size-4 flex-none text-gold-400" aria-hidden />
          <span>
            <strong>Next challenger:</strong> {challenger.id === meId ? "You" : challenger.name} at {fmt(challenger.ce)} CE,{" "}
            <strong className="text-gold-400">{fmt(challenger.gap)} CE</strong> from a seat.
          </span>
        </p>
      )}
    </section>
  );
}
