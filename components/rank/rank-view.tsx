"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES } from "@/lib/grades";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import type { LeaderboardPeriod, LeaderboardSnapshot, LeaderboardStudent } from "@/lib/queries/leaderboard";
import { Avatar, Ce, Empty } from "@/components/ui";

type View = "sorcerers" | "hostels" | "special";

const VIEWS: { key: View; kanji: string; label: string }[] = [
  { key: "sorcerers", kanji: "術師", label: "Sorcerers" },
  { key: "hostels", kanji: "寮", label: "Hostels" },
  { key: "special", kanji: "特級", label: "Special seats" },
];
const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "term", label: "Term" },
  { key: "all", label: "All time" },
];

export function RankView({
  initial,
  meId,
}: {
  initial: Record<LeaderboardPeriod, LeaderboardSnapshot>;
  meId: string;
}) {
  const [view, setView] = useState<View>("sorcerers");
  const [period, setPeriod] = useState<LeaderboardPeriod>("term");
  const { snapshot, live } = useLeaderboard(initial, period);
  const board = snapshot ?? initial[period];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Rankings" className="flex border border-ink-500">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold transition-colors sm:px-4",
                view === v.key ? "bg-bone text-paper-ink" : "text-fg-muted hover:text-fg",
              )}
            >
              <span className="kanji text-[15px]">{v.kanji}</span>
              <span className={v.key === "special" ? "hidden sm:inline" : undefined}>{v.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {view !== "special" && (
            <div className="flex gap-1" role="group" aria-label="Period">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={period === p.key}
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    "h-8 px-2.5 font-mono text-[11px] tracking-wider transition-colors",
                    period === p.key ? "border-b-2 border-blood text-fg" : "text-fg-faint hover:text-fg-muted",
                  )}
                >
                  {p.label.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-fg-muted" aria-live="polite">
            <span className={cn("size-2 rounded-full", live ? "bg-blood shadow-[0_0_8px_var(--color-blood)] animate-pulse" : "bg-ink-400")} />
            {live ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {view === "sorcerers" && <Sorcerers students={board.students} meId={meId} period={period} />}
      {view === "hostels" && <Hostels board={board} meHostel={board.students.find((s) => s.id === meId)?.hostelId ?? null} />}
      {view === "special" && <Special board={board} meId={meId} />}
    </div>
  );
}

/* ── Sorcerers ──────────────────────────────────────────────── */

function Move({ move }: { move: number | null }) {
  if (move === null) return <span className="font-mono text-[10px] text-cursed-soft">NEW</span>;
  if (move === 0) return <Minus className="size-3.5 text-fg-faint" aria-label="No change" />;
  return move > 0 ? (
    <span className="flex items-center font-mono text-[11px] text-[#4fd18b]" aria-label={`Up ${move}`}>
      <ArrowUp className="size-3" aria-hidden />
      {move}
    </span>
  ) : (
    <span className="flex items-center font-mono text-[11px] text-blood-bright" aria-label={`Down ${-move}`}>
      <ArrowDown className="size-3" aria-hidden />
      {-move}
    </span>
  );
}

const PODIUM = [
  { place: 1, kanji: "壱", h: "h-[168px] sm:h-[190px]", color: "var(--color-gold)" },
  { place: 2, kanji: "弐", h: "h-[128px] sm:h-[150px]", color: "#c9c4cf" },
  { place: 3, kanji: "参", h: "h-[108px] sm:h-[124px]", color: "#c27a4a" },
];

function Sorcerers({ students, meId, period }: { students: LeaderboardStudent[]; meId: string; period: LeaderboardPeriod }) {
  if (students.length === 0) return <Empty kanji="空" title="No sorcerers yet" />;
  const top = students.slice(0, 3);
  const rest = students.slice(3);
  const me = students.find((s) => s.id === meId);
  const order = [top[1], top[0], top[2]].filter(Boolean) as LeaderboardStudent[];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-10">
      <div className="flex flex-col gap-5">
        {/* Podium */}
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
          {order.map((s) => {
            const p = PODIUM[s.pos - 1];
            const g = GRADES[s.grade];
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 text-center">
                <Avatar initials={s.initials} grade={s.grade} size={s.pos === 1 ? 64 : 50} />
                <div className="min-w-0 max-w-full">
                  <p className={cn("truncate font-display text-[13px] sm:text-[15px]", s.id === meId && "text-blood-bright")}>
                    {s.name.split(" ")[0]}
                  </p>
                  <p className="kanji text-[12px]" style={{ color: g.color }}>
                    {g.kanji}
                  </p>
                </div>
                <div
                  className={cn("paper relative flex w-full flex-col items-center justify-start pt-3", p.h)}
                  style={{ boxShadow: `inset 0 3px 0 ${p.color}` }}
                >
                  <span className="kanji text-[34px] leading-none sm:text-[44px]" style={{ color: s.pos === 1 ? "var(--color-blood)" : undefined }}>
                    {p.kanji}
                  </span>
                  <Ce value={s.score} className="mt-2 text-[14px] text-paper-ink sm:text-[17px]" />
                </div>
              </div>
            );
          })}
        </div>

        {me && (
          <div className="panel flex items-center gap-4 border-blood/60 p-4" style={{ borderColor: "rgb(215 38 46 / 0.6)" }}>
            <span className="font-display text-[30px] leading-none text-blood">#{me.pos}</span>
            <div className="min-w-0 flex-1">
              <p className="kicker">Your standing · {PERIODS.find((p) => p.key === period)!.label}</p>
              <p className="mt-0.5 text-[13px] text-fg-muted">
                {me.pos === 1
                  ? "You hold the top of the board."
                  : `${(students[me.pos - 2].score - me.score + 1).toLocaleString("en-IN")} CE to pass ${students[me.pos - 2].name.split(" ")[0]}.`}
              </p>
            </div>
            <Ce value={me.score} className="text-[20px]" />
          </div>
        )}
      </div>

      {/* The list */}
      <ol className="flex flex-col">
        {rest.map((s, i) => {
          const g = GRADES[s.grade];
          const mine = s.id === meId;
          return (
            <li
              key={s.id}
              className={cn(
                "rise flex items-center gap-3 border-b border-ink-700 px-2 py-2.5 transition-colors",
                mine && "border-l-2 border-l-blood bg-blood/10",
              )}
              style={{ ["--i" as string]: Math.min(i, 12) }}
            >
              <span className="w-7 text-right font-display text-[15px] text-fg-muted tabular-nums">{s.pos}</span>
              <span className="flex w-7 justify-center">
                <Move move={s.move} />
              </span>
              <Avatar initials={s.initials} grade={s.grade} size={32} />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-[14px] font-bold", mine && "text-blood-bright")}>
                  {s.name}
                  {mine && <span className="ml-1.5 font-mono text-[10px] text-fg-muted">YOU</span>}
                </p>
                <p className="truncate text-[12px] text-fg-faint">{s.hostel}</p>
              </div>
              <span className="kanji hidden w-12 text-center text-[14px] sm:block" style={{ color: g.color }}>
                {g.kanji}
              </span>
              <Ce value={s.score} className="w-20 text-right text-[15px]" />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Hostels ────────────────────────────────────────────────── */

function Hostels({ board, meHostel }: { board: LeaderboardSnapshot; meHostel: string | null }) {
  const lead = board.hostels[0]?.ce || 1;
  return (
    <ol className="grid gap-3 lg:grid-cols-2">
      {board.hostels.map((h, i) => {
        const mine = h.id === meHostel;
        return (
          <li
            key={h.id}
            className={cn("panel rise flex items-center gap-4 p-4", mine && "ring-1 ring-blood")}
            style={{ ["--i" as string]: i }}
          >
            <span className="w-6 font-display text-[20px] text-fg-muted">{h.pos}</span>
            <span
              className="kanji flex size-14 flex-none items-center justify-center text-[30px]"
              style={{ color: h.color, background: `${h.color}14`, boxShadow: `inset 0 0 0 1.5px ${h.color}` }}
            >
              {h.crest}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-[17px]">{h.name}</span>
                {mine && <span className="font-mono text-[10px] text-blood-bright">YOUR HOSTEL</span>}
              </p>
              <div className="mt-1.5 h-1.5 bg-ink-600">
                <div className="h-full" style={{ width: `${(h.ce / lead) * 100}%`, background: h.color, boxShadow: `0 0 10px ${h.color}` }} />
              </div>
              <p className="mt-1.5 truncate text-[12px] text-fg-faint">
                {h.members} sorcerers · {h.perMember.toLocaleString("en-IN")} each
                {h.top[0] && <> · MVP {h.top[0].name.split(" ")[0]}</>}
              </p>
            </div>
            <div className="text-right">
              <Ce value={h.ce} className="block text-[17px]" />
              {h.weekGain > 0 && <span className="font-mono text-[11px] text-[#4fd18b]">+{h.weekGain.toLocaleString("en-IN")} wk</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Special seats ──────────────────────────────────────────── */

function Special({ board, meId }: { board: LeaderboardSnapshot; meId: string }) {
  const { seats, challenger } = board.special;
  return (
    <div>
      <p className="mb-5 max-w-2xl text-[14px] text-fg-muted">
        Only four sorcerers may hold <span className="kanji text-grade-special">特級</span> Special Grade: the four Grade 1 students with the most
        CE. Pass one, and the seat is yours.
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {seats.map((s) => (
          <div
            key={s.seat}
            className={cn(
              "relative flex min-h-[220px] flex-col items-center justify-end gap-2 overflow-hidden border p-4 text-center",
              s.holder ? "border-grade-special/50 bg-gradient-to-b from-grade-special/15 to-ink-900" : "border-dashed border-ink-500 bg-ink-900",
            )}
          >
            <span className="kanji absolute left-1/2 top-2 -translate-x-1/2 text-[90px] leading-none text-grade-special/15">特</span>
            <span className="absolute left-3 top-3 font-mono text-[11px] text-fg-faint">SEAT {s.seat}</span>
            {s.holder ? (
              <>
                <Avatar initials={s.holder.initials} grade="special" size={56} className={cn("relative", s.holder.id === meId && "aura-breathe")} />
                <p className={cn("relative font-display text-[15px] leading-tight", s.holder.id === meId && "text-blood-bright")}>{s.holder.name}</p>
                <p className="relative text-[11px] text-fg-faint">{s.holder.hostel}</p>
                <Ce value={s.holder.ce} className="relative text-[16px] text-grade-special" />
              </>
            ) : (
              <p className="relative text-[13px] text-fg-faint">Unclaimed</p>
            )}
          </div>
        ))}
      </div>
      {challenger && (
        <div className="paper mt-5 flex items-center gap-4 p-4">
          <span className="kanji text-[32px] text-blood">挑</span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-blood">NEXT CHALLENGER</p>
            <p className="font-display text-[16px]">{challenger.id === meId ? "You" : challenger.name}</p>
          </div>
          <p className="text-right text-[13px] text-paper-muted">
            <Ce value={challenger.gap} className="block text-[20px] text-paper-ink" />
            to take a seat
          </p>
        </div>
      )}
    </div>
  );
}
