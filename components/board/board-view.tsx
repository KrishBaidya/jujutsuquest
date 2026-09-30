"use client";

import Link from "next/link";
import { useState } from "react";
import { QrCode, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES, GRADE_ORDER, type GradeKey } from "@/lib/grades";
import { CATEGORIES, me, quests, type CategoryKey } from "@/lib/mock-data";
import { CePill, Chip, Kanji, PageHeader, SealedCard } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";
import { BountyCard, QuestCard } from "./quest-card";

const open = quests.filter((q) => !q.sealedUntil);
const bounty = open.find((q) => q.bounty);
const regular = open.filter((q) => !q.bounty);

export function BoardView() {
  const [category, setCategory] = useState<CategoryKey | "all">("all");
  const [grades, setGrades] = useState<Set<GradeKey>>(new Set());

  const visible = regular.filter(
    (q) => (category === "all" || q.category === category) && (!grades.size || grades.has(q.grade)),
  );

  const toggleGrade = (g: GradeKey) =>
    setGrades((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  const count = (c: CategoryKey) => open.filter((q) => q.category === c).length;

  return (
    <Page>
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden flex-col gap-7 lg:flex">
          <div className="flex flex-col gap-1.5">
            <Kanji className="brush text-5xl leading-none">命</Kanji>
            <h1 className="font-display text-[28px] font-extrabold">Mission board</h1>
            <span className="text-[15px] text-mist-300">{open.length} missions near you</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="mb-1.5 text-[13px] text-mist-500">Category</span>
            <SideRow active={category === "all"} onClick={() => setCategory("all")}>
              <span className="flex-1">All</span>
              <span className="text-[13px]">{open.length}</span>
            </SideRow>
            {CATEGORIES.map((c) => (
              <SideRow key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
                <Kanji className="w-5 text-lg">{c.k}</Kanji>
                <span className="flex-1">{c.label}</span>
                <span className="text-[13px] text-mist-500">{count(c.key)}</span>
              </SideRow>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <span className="mb-1.5 text-[13px] text-mist-500">Grade</span>
            {GRADE_ORDER.map((g) => (
              <label
                key={g}
                className="flex h-9 cursor-pointer items-center gap-2.5 px-3 text-[15px] text-mist-300 hover:text-mist-100"
              >
                <input
                  type="checkbox"
                  checked={grades.has(g)}
                  onChange={() => toggleGrade(g)}
                  className="size-[18px] accent-cursed-500"
                />
                <span className="size-2 rounded-full" style={{ background: GRADES[g].color }} />
                {GRADES[g].label}
              </label>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          {/* Mobile header */}
          <div className="lg:hidden">
            <PageHeader
              kanji="命"
              title="Mission board"
              subtitle={`${open.length} missions near you`}
              right={<CePill value={me.ce} className="h-[34px]" />}
            />
            <div className="flex gap-2 overflow-x-auto px-5 py-4 [scrollbar-width:none]">
              <span className="flex h-9 flex-none items-center gap-1.5 rounded-full border border-night-700 bg-night-800 px-3 text-[13px] text-mist-300">
                <SlidersHorizontal className="size-4" aria-hidden />
                {grades.size ? `${grades.size} grade${grades.size > 1 ? "s" : ""}` : "Any grade"}
              </span>
              <Chip active={category === "all"} onClick={() => setCategory("all")} className="px-3.5">
                All
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
                  <Kanji className="text-[15px]">{c.k}</Kanji>
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[26px] px-[26px] pb-32 pt-1.5 lg:gap-8 lg:px-0 lg:pb-0 lg:pt-0">
            {bounty && category === "all" && !grades.size && <BountyCard quest={bounty} />}
            {visible.length === 0 ? (
              <p className="py-10 text-center text-[15px] text-mist-300">
                No open missions match. Try another category.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-[26px] lg:grid-cols-3 lg:gap-x-7 lg:gap-y-9">
                {visible.map((q, i) => (
                  <QuestCard key={q.id} quest={q} focus={i === 0} />
                ))}
                {category === "all" && !grades.size && <SealedCard />}
              </div>
            )}
          </div>
        </div>
      </div>

      <Link
        href="/verify/club-fair?mode=qr"
        aria-label="Scan a QR code"
        className="fixed bottom-[104px] right-[max(20px,calc(50%-195px))] z-10 flex size-[58px] items-center justify-center rounded-full bg-cursed-500 text-white shadow-[0_8px_24px_rgba(122,92,255,0.5)] lg:hidden"
      >
        <QrCode className="size-7" aria-hidden />
      </Link>
    </Page>
  );
}

function SideRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-10 items-center gap-2.5 rounded-lg px-3 text-left text-[15px]",
        active ? "bg-washi-100 font-bold text-sumi-900" : "text-mist-100 hover:bg-night-800",
      )}
    >
      {children}
    </button>
  );
}
