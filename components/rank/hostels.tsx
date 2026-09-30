"use client";

import Link from "next/link";
import { ChevronRight, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HostelStanding, LeaderboardSnapshot } from "@/lib/queries/leaderboard";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { Scroller } from "@/components/app/scroller";
import { LiveBadge } from "@/components/rank/live-badge";

const fmt = (n: number) => n.toLocaleString("en-US");

function Crest({ hostel, size = "md" }: { hostel: HostelStanding; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-[22%] font-display font-extrabold text-white",
        size === "lg" && "size-[72px] text-[38px] lg:size-[88px] lg:text-[46px]",
        size === "md" && "size-10 text-xl",
        size === "sm" && "size-7 text-sm",
      )}
      style={{
        background: `linear-gradient(145deg, ${hostel.color}, ${hostel.color}99)`,
        boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.18), 0 0 ${size === "lg" ? 28 : 12}px ${hostel.color}77`,
      }}
      aria-hidden
    >
      {hostel.crest}
    </span>
  );
}

/** The student's hostel and its neighbour in the standings. Without a hostel: the top two. */
function pairFor(hostels: HostelStanding[], meHostelId: string | null) {
  const i = hostels.findIndex((h) => h.id === meHostelId);
  if (i < 0) return hostels.length >= 2 ? ([hostels[0], hostels[1]] as const) : null;
  const other = hostels[i - 1] ?? hostels[i + 1];
  return other ? ([hostels[i], other] as const) : null;
}

/** This week's head-to-head for the student's hostel. `compact` drops the contributor lists. */
export function HostelDuel({
  hostels,
  meHostelId,
  compact = false,
}: {
  hostels: HostelStanding[];
  meHostelId: string | null;
  compact?: boolean;
}) {
  const pair = pairFor(hostels, meHostelId);
  if (!pair) return null;
  const [home, away] = pair;
  // adjust rows can be negative; the bar only ever shows positive gains
  const homeGain = Math.max(home.weekGain, 0);
  const awayGain = Math.max(away.weekGain, 0);
  const total = homeGain + awayGain;
  const homePct = total > 0 ? Math.round((homeGain / total) * 100) : 50;
  const lead = home.weekGain - away.weekGain;
  const sides = [home, away];

  return (
    <section className="relative flex flex-col gap-4 overflow-hidden rounded-lg border border-night-600 bg-night-800 p-4 lg:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${home.color}33, transparent 55%), radial-gradient(ellipse at 100% 0%, ${away.color}33, transparent 55%)`,
        }}
      />
      <div className="relative flex items-center justify-between text-[13px]">
        <span className="flex items-center gap-1.5 font-bold">
          <Swords className="size-4 text-cursed-300" aria-hidden />
          Hostel duel · this week
        </span>
        <span className="text-mist-300">
          #{home.pos} vs #{away.pos} overall
        </span>
      </div>

      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {sides.map((hostel, i) => (
          <div
            key={hostel.id}
            className={cn("rise-in flex flex-col items-center gap-1.5 text-center", i === 1 && "order-3")}
            style={{ animationDelay: `${i * 140}ms` }}
          >
            <span className={cn(!compact && "float")} style={{ animationDelay: `${i * 900}ms` }}>
              <Crest hostel={hostel} size={compact ? "md" : "lg"} />
            </span>
            <span className="flex items-center gap-1.5 font-display text-lg font-extrabold">
              {hostel.name}
              {hostel.id === meHostelId && (
                <span className="rounded-full bg-cursed-500 px-1.5 py-px font-body text-[11px] font-bold text-night-950">
                  yours
                </span>
              )}
            </span>
            <span className="font-display text-2xl font-extrabold lg:text-[32px]" style={{ color: hostel.color }}>
              +{fmt(hostel.weekGain)}
            </span>
            <span className="text-[11px] text-mist-500">{fmt(hostel.ce)} CE total</span>
          </div>
        ))}
        <span className="stamp-in order-2 flex size-11 items-center justify-center rounded-[10px] bg-seal-600 font-display text-xl font-extrabold text-washi-100 shadow-[inset_0_0_0_2px_#D8392B,inset_0_0_0_3px_#EFE9DC]">
          対
        </span>
      </div>

      {/* tug of war */}
      <div className="relative flex flex-col gap-1.5">
        <div
          className="flex h-3.5 overflow-hidden rounded-full bg-night-700"
          role="img"
          aria-label={`${home.name} ${homePct}%, ${away.name} ${100 - homePct}%`}
        >
          <div
            className="h-full transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${homePct}%`, background: home.color, boxShadow: `0 0 14px ${home.color}` }}
          />
          <div className="h-full w-0.5 bg-washi-100" />
          <div className="h-full flex-1" style={{ background: away.color, opacity: 0.85 }} />
        </div>
        <div className="flex justify-between text-[13px] text-mist-300">
          <span>{homePct}%</span>
          <span className="font-bold text-mist-100">
            {lead === 0 ? "Level this week" : `${lead > 0 ? home.name : away.name} leads by ${fmt(Math.abs(lead))} CE`}
          </span>
          <span>{100 - homePct}%</span>
        </div>
      </div>

      {compact ? (
        <Link
          href="/rank?view=hostels"
          scroll={false}
          className="relative flex items-center justify-center gap-1 text-[13px] font-bold text-cursed-300 hover:text-mist-100"
        >
          See the full duel
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <div className="relative grid grid-cols-2 gap-3">
          {sides.map((hostel) => (
            <div key={hostel.id} className="flex flex-col gap-1.5 rounded bg-night-950/60 p-3">
              <span className="text-[13px] text-mist-500">Top contributors</span>
              {hostel.top.length === 0 && <span className="text-[13px] text-mist-300">No CE earned this week yet.</span>}
              {hostel.top.map((t, i) => (
                <div key={t.id} className="flex items-center gap-2 text-[13px]">
                  <span className="w-3 font-display font-extrabold text-mist-500">{i + 1}</span>
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="font-display font-extrabold">+{fmt(t.ce)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Standings({ hostels, meHostelId }: { hostels: HostelStanding[]; meHostelId: string | null }) {
  const max = Math.max(1, ...hostels.map((h) => h.ce));
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-extrabold lg:text-[22px]">Hostel standings</h2>
        <span className="text-[13px] text-mist-300">Total CE of all members</span>
      </div>
      <ol className="flex flex-col rounded-lg border border-night-700 bg-night-800 px-4 py-1">
        {hostels.map((h) => {
          const mine = h.id === meHostelId;
          return (
            <li
              key={h.id}
              className={cn(
                "grid grid-cols-[22px_auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-3 last:border-b-0",
                mine && "-mx-2 rounded-lg border border-cursed-500 bg-cursed-500/10 px-2 last:border-b",
              )}
            >
              <span className="font-display text-xl font-extrabold text-mist-300">{h.pos}</span>
              <Crest hostel={h} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[15px] font-bold">{h.name}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-night-700">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
                    style={{ width: `${Math.round((h.ce / max) * 100)}%`, background: h.color }}
                  />
                </div>
                <span className="text-[13px] text-mist-300">
                  {h.members} members · {fmt(h.perMember)} CE each · +{fmt(h.weekGain)} this week
                </span>
              </div>
              <span className="font-display text-[17px] font-extrabold">{fmt(h.ce)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PairingCard({
  home,
  away,
  meHostelId,
}: {
  home: HostelStanding;
  away: HostelStanding;
  meHostelId: string | null;
}) {
  const mine = home.id === meHostelId || away.id === meHostelId;
  return (
    <div
      className={cn(
        "flex w-[220px] flex-col gap-2.5 rounded-lg border bg-night-800 p-3.5",
        mine ? "border-cursed-500" : "border-night-700",
      )}
    >
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-mist-300">
          #{home.pos} vs #{away.pos}
        </span>
        <span className="text-mist-500">This week</span>
      </div>
      {[
        { h: home, other: away },
        { h: away, other: home },
      ].map(({ h, other }) => (
        <div key={h.id} className="flex items-center gap-2">
          <Crest hostel={h} size="sm" />
          <span className="flex-1 truncate text-[15px] font-bold">{h.name}</span>
          <span
            className={cn(
              "font-display text-[15px] font-extrabold",
              h.weekGain < other.weekGain && "text-mist-500",
            )}
          >
            +{fmt(h.weekGain)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HostelsView({
  initial,
  meHostelId,
}: {
  initial: LeaderboardSnapshot;
  meHostelId: string | null;
}) {
  const { snapshot: latest, live } = useLeaderboard({ all: initial }, "all");
  const { hostels } = latest ?? initial;
  const pairs = Array.from({ length: Math.floor(hostels.length / 2) }, (_, i) => [hostels[i * 2], hostels[i * 2 + 1]] as const);

  return (
    <div className="flex flex-col gap-7 px-5 pb-8 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:px-0 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-7">
        <HostelDuel hostels={hostels} meHostelId={meHostelId} />
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-extrabold lg:text-[22px]">Pairings</h2>
            <span className="flex items-center gap-2 text-[13px] text-mist-300">
              Neighbours in the standings
              <LiveBadge live={live} />
            </span>
          </div>
          <Scroller label="Hostel pairings" className="-mx-5 lg:mx-0" trackClassName="px-5 lg:px-0">
            {pairs.map(([home, away]) => (
              <PairingCard key={`${home.id}-${away.id}`} home={home} away={away} meHostelId={meHostelId} />
            ))}
          </Scroller>
        </section>
      </div>
      <Standings hostels={hostels} meHostelId={meHostelId} />
    </div>
  );
}
