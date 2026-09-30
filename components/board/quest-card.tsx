import Link from "next/link";
import { Camera, MapPin, QrCode, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES } from "@/lib/grades";
import { categoryOf } from "@/lib/categories";
import type { QuestView } from "@/lib/queries/quests";
import type { MissionStatus } from "@/lib/db/schema";
import { Ce } from "@/components/ui";
import { Countdown } from "./countdown";

/** `tone` is for dark surfaces, `paper` for talisman paper. */
export const STATUS_STAMP: Record<MissionStatus, { kanji: string; label: string; tone: string; paper: string }> = {
  accepted: { kanji: "誓", label: "Vowed", tone: "text-cursed-soft border-cursed-soft", paper: "text-cursed border-cursed" },
  in_review: { kanji: "審", label: "Under review", tone: "text-gold border-gold", paper: "text-[#9a6a12] border-[#9a6a12]" },
  completed: { kanji: "祓", label: "Exorcised", tone: "text-blood border-blood", paper: "text-blood border-blood" },
  rejected: { kanji: "破", label: "Failed", tone: "text-fg-muted border-fg-muted", paper: "text-paper-muted border-paper-muted" },
};

/** A mission as a horizontal talisman: grade strip, title, place, reward. */
export function QuestCard({ quest, index = 0 }: { quest: QuestView; index?: number }) {
  const g = GRADES[quest.grade];
  const cat = categoryOf(quest.category);
  const stamp = quest.missionStatus ? STATUS_STAMP[quest.missionStatus] : null;
  return (
    <Link
      href={`/quests/${quest.id}`}
      className="panel rise group flex min-h-[148px] overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ ["--i" as string]: index }}
    >
      {/* Grade strip */}
      <div
        className="relative flex w-12 flex-none flex-col items-center justify-between py-3"
        style={{ background: `linear-gradient(180deg, rgb(${g.glow} / 0.28), rgb(${g.glow} / 0.06))` }}
      >
        <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: g.color, boxShadow: `0 0 12px ${g.color}` }} />
        <span className="kanji text-[20px] [writing-mode:vertical-rl]" style={{ color: g.color }}>
          {g.kanji}
        </span>
        <span className="font-mono text-[10px] text-fg-faint">{g.short}</span>
      </div>

      {/* Body */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-2 p-4">
        {quest.locationImage && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-cover bg-center opacity-[0.16] grayscale transition-opacity duration-500 [mask-image:linear-gradient(90deg,transparent,black)] group-hover:opacity-30"
            style={{ backgroundImage: `url(${quest.locationImage})` }}
          />
        )}
        <div className="relative flex items-center gap-2 text-[12px] text-fg-muted">
          <span className="kanji text-[15px] text-fg">{cat.k}</span>
          <span className="font-bold uppercase tracking-wider">{cat.label}</span>
          {quest.isBounty && (
            <span className="ml-1 bg-blood px-1.5 py-px font-mono text-[10px] font-semibold tracking-widest text-bone">
              BOUNTY
            </span>
          )}
        </div>
        <h3 className="relative font-display text-[18px] leading-[1.2] tracking-tight group-hover:text-bone">
          {quest.title}
        </h3>
        <p className="relative flex items-center gap-1.5 text-[13px] text-fg-muted">
          <MapPin className="size-3.5 text-blood" aria-hidden />
          {quest.locationName}
        </p>
        <div className="relative mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 text-[12px] text-fg-faint">
            <span className="flex items-center gap-1">
              {quest.verification === "qr" ? (
                <QrCode className="size-3.5" aria-hidden />
              ) : (
                <Camera className="size-3.5" aria-hidden />
              )}
              {quest.verification === "qr" ? "Seal scan" : "Photo"}
            </span>
            {quest.expiresAt && (
              <span className="flex items-center gap-1 text-blood-bright">
                <Timer className="size-3.5" aria-hidden />
                <Countdown to={quest.expiresAt} />
              </span>
            )}
          </div>
          <Ce value={quest.ce} sign className="text-[22px] leading-none text-bone" />
        </div>
      </div>

      {stamp && (
        <span
          className={cn(
            "stamp-in absolute right-3 top-3 flex items-center gap-1 border-2 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
            stamp.tone,
          )}
        >
          <span className="kanji text-[14px]">{stamp.kanji}</span>
          {stamp.label}
        </span>
      )}
    </Link>
  );
}
