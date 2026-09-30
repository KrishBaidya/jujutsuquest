"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Flame, Minus, Sparkles, Swords, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES } from "@/lib/grades";
import {
  NEAR_START,
  TOP_COUNT,
  departments,
  leaders,
  me,
  type Leader,
  type Period,
} from "@/lib/mock-data";
import { Chip, Segmented } from "@/components/app/primitives";
import { CountUp } from "@/components/app/count-up";
import { Scroller } from "@/components/app/scroller";

type Ranked = Leader & { pos: number; score: number };

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "term", label: "Term" },
  { value: "all", label: "All time" },
];

const HOT_STREAK = 7;

function rank(period: Period, dept: string): { rows: Ranked[]; gapAfter: number | null } {
  const byScore = (a: Leader, b: Leader) => b.ce[period] - a.ce[period];
  if (dept !== "all") {
    const rows = leaders
      .filter((l) => l.dept === dept)
      .sort(byScore)
      .map((l, i) => ({ ...l, pos: i + 1, score: l.ce[period] }));
    return { rows, gapAfter: null };
  }
  // Campus-wide: the top of the table, then the student's own neighbourhood.
  const top = leaders.slice(0, TOP_COUNT).sort(byScore);
  const near = leaders.slice(TOP_COUNT).sort(byScore);
  return {
    rows: [
      ...top.map((l, i) => ({ ...l, pos: i + 1, score: l.ce[period] })),
      ...near.map((l, i) => ({ ...l, pos: NEAR_START + i, score: l.ce[period] })),
    ],
    gapAfter: TOP_COUNT,
  };
}

export function CampusBoard({ aside }: { aside?: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>("term");
  const [dept, setDept] = useState("all");
  const [meVisible, setMeVisible] = useState(true);
  const meRow = useRef<HTMLLIElement>(null);
  const standing = useRef<HTMLDivElement>(null);

  const { rows, gapAfter } = rank(period, dept);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const meIndex = rows.findIndex((r) => r.isMe);
  const mine = meIndex >= 0 ? rows[meIndex] : undefined;
  const rival = meIndex > 0 ? rows[meIndex - 1] : undefined;

  useEffect(() => {
    const targets = [meRow.current, standing.current].filter((el) => el !== null);
    if (!targets.length) return;
    const onScreen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onScreen.add(e.target);
          else onScreen.delete(e.target);
        }
        setMeVisible(onScreen.size > 0);
      },
      { threshold: 0.3 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [period, dept]);

  const jumpToMe = () => meRow.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
      <div className="flex min-w-0 flex-col gap-5">
        {/* filters */}
        <div className="flex flex-col gap-3 px-5 lg:flex-row lg:items-center lg:px-0">
          <Segmented
            label="Period"
            value={period}
            onChange={setPeriod}
            items={PERIODS}
            className="lg:w-[320px] lg:flex-none"
          />
          <Scroller label="Filter by department" className="-mx-5 min-w-0 lg:mx-0 lg:flex-1" trackClassName="gap-2 px-5 lg:px-0">
            <Chip active={dept === "all"} onClick={() => setDept("all")} className="px-3.5">
              All schools
            </Chip>
            {departments.map((d) => (
              <Chip key={d} active={dept === d} onClick={() => setDept(d)}>
                {d}
              </Chip>
            ))}
          </Scroller>
        </div>

        {podium.length === 3 && <Podium key={`${period}-${dept}`} rows={podium} />}

        {/* mobile: standing sits between podium and list */}
        {mine && (
          <div ref={standing} className="px-5 lg:hidden">
            <Standing mine={mine} rival={rival} scoped={dept !== "all"} />
          </div>
        )}

        <section className="lg:overflow-hidden lg:rounded-lg lg:border lg:border-night-700 lg:bg-night-800">
          <div className="flex items-center justify-between px-5 pb-2 lg:border-b lg:border-night-700 lg:py-3">
            <h2 className="text-[13px] text-mist-500">
              {dept === "all" ? `${me.campusSize} sorcerers` : `${rows.length} shown in ${dept}`}
            </h2>
            {mine && (
              <button
                type="button"
                onClick={jumpToMe}
                className="flex h-8 items-center gap-1.5 rounded-full border border-cursed-500 px-3 text-[13px] font-bold text-cursed-300 transition-colors hover:bg-cursed-500 hover:text-night-950"
              >
                <Target className="size-3.5" aria-hidden />
                Jump to me
              </button>
            )}
          </div>
          <ol className="scroll-y flex flex-col px-5 pb-[110px] lg:max-h-[520px] lg:pb-0">
            {rows.length < 3 &&
              rows.map((r) => <Row key={r.id} row={r} above={undefined} ref={r.isMe ? meRow : undefined} />)}
            {rows.length >= 3 &&
              rest.map((r, i) => {
                const index = i + 3;
                return (
                  <FragmentRow
                    key={r.id}
                    showGap={gapAfter === index}
                    from={TOP_COUNT + 1}
                    to={NEAR_START - 1}
                  >
                    <Row row={r} above={rows[index - 1]} gapBroken={gapAfter === index} ref={r.isMe ? meRow : undefined} />
                  </FragmentRow>
                );
              })}
            {rows.length === 0 && (
              <li className="py-10 text-center text-[15px] text-mist-300">No sorcerers ranked here yet.</li>
            )}
          </ol>
        </section>
      </div>

      <aside className="hidden flex-col gap-6 lg:sticky lg:top-[104px] lg:flex">
        {mine && <Standing mine={mine} rival={rival} scoped={dept !== "all"} />}
        {aside}
      </aside>

      {mine && !meVisible && (
        <button
          type="button"
          onClick={jumpToMe}
          className="sheet-in fixed inset-x-0 bottom-[100px] z-10 mx-auto flex w-full max-w-[430px] px-3.5 text-left lg:hidden"
        >
          <span className="flex w-full items-center gap-3 rounded-lg border border-cursed-500 bg-night-800 px-3.5 py-3 shadow-[0_0_24px_rgba(61,139,255,0.3)]">
            <span className="w-[30px] text-center font-display text-xl font-extrabold text-cursed-300">
              {mine.pos}
            </span>
            <Avatar row={mine} />
            <span className="flex flex-1 flex-col">
              <span className="text-[15px] font-bold">You</span>
              <span className="text-[13px] text-mist-300">
                {rival ? `${(rival.score - mine.score + 1).toLocaleString("en-US")} CE to pass ${rival.name.split(" ")[0]}` : "Top of the table"}
              </span>
            </span>
            <span className="font-display text-[17px] font-extrabold">{mine.score.toLocaleString("en-US")}</span>
          </span>
        </button>
      )}
    </div>
  );
}

function FragmentRow({
  children,
  showGap,
  from,
  to,
}: {
  children: React.ReactNode;
  showGap: boolean;
  from: number;
  to: number;
}) {
  return (
    <>
      {showGap && (
        <li aria-hidden className="flex items-center gap-3 py-3 text-[13px] text-mist-500">
          <span className="h-px flex-1 bg-line" />
          ranks {from}–{to}
          <span className="h-px flex-1 bg-line" />
        </li>
      )}
      {children}
    </>
  );
}

function Avatar({ row, size = "md" }: { row: Ranked; size?: "md" | "lg" }) {
  const color = GRADES[row.grade].color;
  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-full font-bold",
        size === "lg" ? "size-14 text-[15px]" : "size-[38px] text-[13px]",
        row.isMe ? "bg-cursed-500 text-night-950" : "bg-night-700",
      )}
      style={{ boxShadow: `0 0 0 2px #14161B, 0 0 0 4px ${color}, 0 0 14px ${color}66` }}
    >
      {row.initials}
    </span>
  );
}

function Move({ move }: { move: number | null }) {
  if (move === null)
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wide text-gold-400">
        <Sparkles className="size-3" aria-hidden />
        new
      </span>
    );
  if (move === 0)
    return (
      <span className="flex items-center text-mist-500" aria-label="No change">
        <Minus className="size-3" aria-hidden />
      </span>
    );
  const up = move > 0;
  return (
    <span
      className={cn("flex items-center gap-0.5 text-[11px] font-bold", up ? "text-jade-500" : "text-flash-500")}
      aria-label={`${up ? "Up" : "Down"} ${Math.abs(move)}`}
    >
      {up ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />}
      {Math.abs(move)}
    </span>
  );
}

function Streak({ days }: { days: number }) {
  if (days < HOT_STREAK) return null;
  return (
    <span className="flex items-center gap-0.5 rounded-full bg-ember-500/15 px-1.5 text-[11px] font-bold text-ember-500">
      <Flame className="flame size-3" aria-hidden />
      {days}
    </span>
  );
}

function Row({
  row,
  above,
  gapBroken,
  ref,
}: {
  row: Ranked;
  above: Ranked | undefined;
  gapBroken?: boolean;
  ref?: React.Ref<HTMLLIElement>;
}) {
  const g = GRADES[row.grade];
  const behind = above && !gapBroken ? above.score - row.score : null;
  return (
    <li
      ref={ref}
      className={cn(
        "flex items-center gap-3 border-b border-line py-2.5 transition-colors lg:px-5",
        row.isMe
          ? "relative -mx-2 rounded-lg border border-cursed-500 bg-cursed-500/10 px-2 shadow-[0_0_24px_rgba(61,139,255,0.25)] lg:mx-0 lg:rounded-none lg:border-x-0"
          : "lg:hover:bg-night-700/40",
      )}
    >
      <span className="flex w-8 flex-none flex-col items-center">
        <span
          className={cn(
            "font-display text-xl font-extrabold leading-tight",
            row.isMe ? "text-cursed-300" : "text-mist-300",
          )}
        >
          {row.pos}
        </span>
        <Move move={row.move} />
      </span>
      <Avatar row={row} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5 text-[15px] font-bold">
          <span className="truncate">{row.isMe ? "You" : row.name}</span>
          <Streak days={row.streak} />
        </span>
        <span className="flex items-center gap-[5px] truncate text-[13px] text-mist-300">
          <span className="size-[7px] flex-none rounded-full" style={{ background: g.color }} />
          {g.label} · {row.dept} · {row.hostel}
        </span>
      </span>
      <span className="flex flex-none flex-col items-end">
        <span className="font-display text-[17px] font-extrabold">{row.score.toLocaleString("en-US")}</span>
        {behind !== null && behind > 0 && (
          <span className="text-[11px] text-mist-500">−{behind.toLocaleString("en-US")}</span>
        )}
      </span>
    </li>
  );
}

/* ---------- podium ---------- */

const PLACES = [
  { kanji: "二", plinth: "h-[64px]", tone: "#C9CCD6", order: "order-1" },
  { kanji: "一", plinth: "h-[92px]", tone: "#E0B04A", order: "order-2" },
  { kanji: "三", plinth: "h-[44px]", tone: "#C0793E", order: "order-3" },
];

function Podium({ rows }: { rows: Ranked[] }) {
  // Visual order is 2nd, 1st, 3rd.
  const slots = [
    { row: rows[1], ...PLACES[0] },
    { row: rows[0], ...PLACES[1] },
    { row: rows[2], ...PLACES[2] },
  ];
  return (
    <div className="relative mx-5 grid grid-cols-3 items-end gap-2 lg:mx-0 lg:gap-4">
      <div className="pointer-events-none absolute inset-x-[20%] top-0 h-40 bg-[radial-gradient(ellipse,rgba(224,176,74,0.22),transparent_70%)]" />
      {slots.map(({ row, kanji, plinth, tone }, i) => {
        const first = row.pos === rows[0].pos;
        return (
          <div key={row.id} className="relative flex flex-col items-center">
            <div
              className="rise-in flex w-full flex-col items-center gap-1.5 pb-3 text-center"
              style={{ animationDelay: `${120 + i * 110}ms` }}
            >
              <span
                className={cn(
                  "stamp-in flex items-center justify-center rounded-md font-display font-extrabold text-night-950",
                  first ? "size-9 text-xl" : "size-7 text-base",
                )}
                style={{ background: tone, animationDelay: `${380 + i * 110}ms` }}
                aria-hidden
              >
                {kanji}
              </span>
              <span className={cn(first && "float")}>
                <Avatar row={row} size={first ? "lg" : "md"} />
              </span>
              <span className="flex max-w-full flex-col">
                <span className="truncate text-[13px] font-bold lg:text-[15px]">
                  {row.isMe ? "You" : row.name}
                </span>
                <span className="truncate text-[11px] text-mist-300 lg:text-[13px]">{row.hostel}</span>
              </span>
              <span className="font-display text-[17px] font-extrabold lg:text-xl" style={{ color: tone }}>
                <CountUp value={row.score} />
              </span>
              <Streak days={row.streak} />
            </div>
            <div
              className={cn(
                "plinth flex w-full items-start justify-center rounded-t-md border border-b-0 border-night-600 bg-gradient-to-b from-night-700 to-night-800 pt-1.5",
                plinth,
              )}
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className="font-display text-2xl font-extrabold text-mist-500">{row.pos}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- your standing ---------- */

function Standing({ mine, rival, scoped }: { mine: Ranked; rival?: Ranked; scoped: boolean }) {
  const g = GRADES[mine.grade];
  const gap = rival ? rival.score - mine.score + 1 : 0;
  const pct = rival ? Math.max(6, Math.round((mine.score / (rival.score + 1)) * 100)) : 100;
  return (
    <section className="flex flex-col gap-3.5 rounded-lg border border-cursed-500 bg-night-800 p-4 shadow-[0_0_28px_rgba(61,139,255,0.22)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <span className="font-display text-[40px] font-extrabold leading-none text-cursed-300">
          #{mine.pos}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] text-mist-300">{scoped ? "Your rank in school" : "Your campus rank"}</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-[15px] font-bold">
            <span className="size-2 flex-none rounded-full" style={{ background: g.color }} />
            {g.label}
            <span className="font-display font-extrabold">· {mine.score.toLocaleString("en-US")} CE</span>
          </span>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end sm:gap-1">
          <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-jade-500/15 px-2 py-0.5 text-[13px] font-bold text-jade-500">
            <ArrowUp className="size-3.5" aria-hidden />
            {me.weekMove} this week
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap text-[13px] font-bold text-ember-500">
            <Flame className="flame size-4" aria-hidden />
            {me.streak}-day streak
          </span>
        </div>
      </div>

      {rival ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1.5 text-mist-300">
              <Swords className="size-4 text-cursed-300" aria-hidden />
              Rival: <strong className="text-mist-100">{rival.name}</strong>
            </span>
            <span className="font-display font-extrabold text-cursed-300">{gap.toLocaleString("en-US")} CE to pass</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-night-700">
            <div
              className="gauge-fill h-full rounded-full bg-gradient-to-r from-azure-500 to-cursed-500 shadow-[0_0_12px_rgba(61,139,255,0.8)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-mist-300">Nobody above you here. Hold the line.</p>
      )}

      <div className="flex items-center gap-2.5 rounded border border-dashed border-gold-400/50 bg-gold-400/10 px-3 py-2 text-[13px]">
        <Target className="size-4 flex-none text-gold-400" aria-hidden />
        <span>
          <strong>Weekly bounty:</strong> climb one rank before Sunday for{" "}
          <strong className="text-gold-400">+50 CE</strong>.
        </span>
      </div>
    </section>
  );
}
