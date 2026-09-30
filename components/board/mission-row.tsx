import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES } from "@/lib/grades";
import type { getMissions } from "@/lib/queries/me";
import { Ce, btnClass } from "@/components/ui";
import { STATUS_STAMP } from "./quest-card";

type Mission = Awaited<ReturnType<typeof getMissions>>["accepted"][number];

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

/** One of the student's missions, with the next step it needs. */
export function MissionRow({ mission: m, index = 0 }: { mission: Mission; index?: number }) {
  const g = GRADES[m.grade];
  const stamp = STATUS_STAMP[m.status];
  const canVerify = m.status === "accepted" || m.status === "rejected";
  return (
    <div className="panel rise flex flex-col gap-3 p-4 sm:flex-row sm:items-center" style={{ ["--i" as string]: index }}>
      <Link href={`/quests/${m.questId}`} className="flex min-w-0 flex-1 items-center gap-4">
        <span
          className={cn("flex size-14 flex-none flex-col items-center justify-center border-2", stamp.tone)}
          aria-hidden
        >
          <span className="kanji text-[26px]">{stamp.kanji}</span>
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
            <span className={stamp.tone.split(" ")[0]}>{stamp.label}</span>
            <span className="kanji text-[13px]" style={{ color: g.color }}>
              {g.kanji}
            </span>
          </p>
          <p className="truncate font-display text-[16px] leading-snug">{m.title}</p>
          <p className="flex items-center gap-1 text-[12px] text-fg-muted">
            <MapPin className="size-3 text-blood" aria-hidden />
            {m.locationName}
            {m.status === "completed" && m.completedAt && <> · {dateFmt.format(m.completedAt)}</>}
          </p>
          {m.status === "rejected" && m.rejectReason && (
            <p className="mt-1 border-l-2 border-blood pl-2 text-[12px] text-fg-muted">{m.rejectReason}</p>
          )}
        </div>
      </Link>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        {m.status === "completed" ? (
          <Ce value={m.earned} sign className="text-[20px] text-blood" />
        ) : (
          <Ce value={m.ce} sign className="text-[17px] text-fg-muted" />
        )}
        {canVerify ? (
          <Link href={`/verify/${m.questId}`} className={btnClass("blood", "sm")}>
            {m.status === "rejected" ? "Try again" : "Exorcise"}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : m.status === "in_review" ? (
          <span className="text-[12px] text-gold">A senior sorcerer is checking</span>
        ) : null}
      </div>
    </div>
  );
}
