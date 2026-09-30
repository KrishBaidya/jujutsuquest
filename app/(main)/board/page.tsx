import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { GRADES, gradeProgress } from "@/lib/grades";
import { listOpenQuests } from "@/lib/queries/quests";
import { getMissions } from "@/lib/queries/me";
import { getViewer } from "@/lib/queries/session";
import { Btn, Ce, CeBar, Empty, GradeSeal, PageHead, Screen } from "@/components/ui";
import { QuestCard } from "@/components/board/quest-card";
import { MissionRow } from "@/components/board/mission-row";
import { Countdown } from "@/components/board/countdown";

export const metadata: Metadata = { title: "Missions" };
export const dynamic = "force-dynamic";

type Tab = "open" | "active" | "done";
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function BoardPage({ searchParams }: PageProps<"/board">) {
  const sp = await searchParams;
  const user = (await getViewer())!;
  const [quests, missions] = await Promise.all([listOpenQuests(user.id), getMissions(user.id)]);

  const tabParam = first(sp.tab);
  const tab: Tab = tabParam === "active" || tabParam === "done" ? tabParam : "open";
  const catParam = first(sp.cat);
  const cat = CATEGORIES.find((c) => c.key === catParam)?.key as CategoryKey | undefined;

  const open = quests.filter((q) => q.missionStatus !== "completed");
  const shown = cat ? open.filter((q) => q.category === cat) : open;
  const bounty = open.find((q) => q.isBounty && q.expiresAt);
  const active = [...missions.accepted, ...missions.inReview, ...missions.rejected];
  const done = missions.completed;

  const p = gradeProgress(user.ce);
  const g = GRADES[user.display];
  const next = p.next ? GRADES[p.next] : null;

  const tabs: { key: Tab; kanji: string; label: string; count: number }[] = [
    { key: "open", kanji: "公", label: "Open", count: open.length },
    { key: "active", kanji: "誓", label: "Vowed", count: active.length },
    { key: "done", kanji: "祓", label: "Exorcised", count: done.length },
  ];

  return (
    <Screen>
      <PageHead
        kanji="任務"
        kicker="Jujutsu High · Mission board"
        title="Missions"
        sub={
          <>
            <span className="text-blood-bright">{open.length}</span> curses sighted across campus.
          </>
        }
        right={
          <Btn href="/quests/new" variant="ghost" size="sm" aria-label="Report a curse">
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Report a curse</span>
          </Btn>
        }
      />

      {/* Status + bounty */}
      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_1.25fr]">
        <Link href="/me" className="panel group flex items-center gap-5 p-5">
          <GradeSeal grade={user.display} size={64} />
          <div className="min-w-0 flex-1">
            <p className="kicker">{g.feel}</p>
            <p className="font-display text-[20px] leading-tight">
              {g.label} <span className="text-fg-muted">sorcerer</span>
            </p>
            <div className="mt-2.5 flex items-baseline justify-between text-[12px] text-fg-muted">
              <Ce value={user.ce} className="text-[16px] text-fg" />
              {next ? (
                <span>
                  {p.toNext.toLocaleString("en-IN")} to{" "}
                  <span className="kanji" style={{ color: next.color }}>
                    {next.kanji}
                  </span>
                </span>
              ) : (
                <span>Top of the ladder</span>
              )}
            </div>
            <CeBar ratio={p.ratio} color={next?.color ?? g.color} className="mt-1.5" />
          </div>
        </Link>

        {bounty ? (
          <Link
            href={`/quests/${bounty.id}`}
            className="paper group relative flex items-center gap-4 overflow-hidden p-4 pr-5 transition-transform hover:-translate-y-0.5 sm:p-5 sm:pr-6"
          >
            <span className="absolute inset-y-0 left-0 w-2 bg-blood" />
            <span className="kanji ml-2 text-[40px] leading-none text-blood [writing-mode:vertical-rl] sm:text-[52px]">懸賞</span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-blood">
                BOUNTY · ENDS IN <Countdown to={bounty.expiresAt!} />
              </p>
              <p className="mt-1 font-display text-[17px] leading-tight sm:text-[19px]">{bounty.title}</p>
              <p className="mt-1 text-[13px] text-paper-muted">
                {bounty.locationName}
                <Ce value={bounty.ce} sign className="ml-3 text-[18px] text-blood sm:hidden" />
              </p>
            </div>
            <div className="hidden flex-col items-end gap-1 sm:flex">
              <Ce value={bounty.ce} sign className="text-[26px] leading-none text-blood" />
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </div>
          </Link>
        ) : (
          <div className="panel flex items-center gap-4 p-5 text-fg-muted">
            <span className="kanji text-[40px] text-ink-400">懸賞</span>
            No bounty is posted right now. Check back after dusk.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-ink-600">
        <nav aria-label="Mission lists" className="scrollbar-none -mb-px flex gap-4 overflow-x-auto sm:gap-5">
          {tabs.map((t) => {
            const on = t.key === tab;
            return (
              <Link
                key={t.key}
                href={t.key === "open" ? "/board" : `/board?tab=${t.key}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex flex-none items-center gap-1.5 border-b-2 pb-3 pt-1 transition-colors sm:gap-2",
                  on ? "border-blood text-fg" : "border-transparent text-fg-faint hover:text-fg-muted",
                )}
              >
                <span className={cn("kanji text-[20px]", on && "text-blood")}>{t.kanji}</span>
                <span className="font-display text-[14px] tracking-wide sm:text-[15px]">{t.label}</span>
                <span className="font-mono text-[11px] text-fg-faint">{t.count}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {tab === "open" && (
        <>
          <div className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <FilterChip href="/board" on={!cat} label="All" kanji="全" />
            {CATEGORIES.map((c) => (
              <FilterChip key={c.key} href={`/board?cat=${c.key}`} on={cat === c.key} label={c.label} kanji={c.k} />
            ))}
          </div>
          {shown.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((q, i) => (
                <QuestCard key={q.id} quest={q} index={i} />
              ))}
            </div>
          ) : (
            <Empty kanji="静" title="The campus is quiet">
              No open missions {cat ? "in this category" : "right now"}. Report a curse you have seen.
            </Empty>
          )}
        </>
      )}

      {tab === "active" &&
        (active.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {active.map((m, i) => (
              <MissionRow key={m.id} mission={m} index={i} />
            ))}
          </div>
        ) : (
          <Empty kanji="誓" title="No vows taken">
            Accept a mission from the board. It will wait here until you exorcise it on site.
          </Empty>
        ))}

      {tab === "done" &&
        (done.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {done.map((m, i) => (
              <MissionRow key={m.id} mission={m} index={i} />
            ))}
          </div>
        ) : (
          <Empty kanji="祓" title="Nothing exorcised yet">
            Your cleared missions and the CE they paid will be recorded here.
          </Empty>
        ))}
    </Screen>
  );
}

function FilterChip({ href, on, label, kanji }: { href: string; on: boolean; label: string; kanji: string }) {
  return (
    <Link
      href={href}
      aria-current={on ? "true" : undefined}
      className={cn(
        "flex h-9 flex-none items-center gap-1.5 border px-3 text-[13px] font-bold transition-colors",
        on ? "border-bone bg-bone text-paper-ink" : "border-ink-500 text-fg-muted hover:border-fg-faint hover:text-fg",
      )}
    >
      <span className="kanji text-[15px]">{kanji}</span>
      {label}
    </Link>
  );
}
