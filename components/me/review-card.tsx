"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { reviewSubmission } from "@/lib/actions/review";
import { Ce, btnClass } from "@/components/ui";

type Sub = {
  id: string;
  photo: string | null;
  questTitle: string;
  questCe: number;
  locationName: string;
  studentName: string;
  studentUid: string;
  confidence: number | null;
  reason: string | null;
  ageMinutes: number;
};

const age = (m: number) => (m < 1 ? "now" : m < 60 ? `${m}m` : m < 2880 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`);

export function ReviewCard({ sub }: { sub: Sub }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [pending, start] = useTransition();

  const decide = (approve: boolean) =>
    start(async () => {
      setError(null);
      const res = await reviewSubmission(sub.id, approve ? { approve: true } : { approve: false, reason });
      if (!res.ok) return setError(res.error);
      setDone(approve ? "approved" : "rejected");
      router.refresh();
    });

  return (
    <article className="panel rise flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] bg-ink-800">
        {sub.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed bucket URL
          <img src={sub.photo} alt={`Proof for ${sub.questTitle}`} className="size-full object-cover" />
        ) : (
          <div className="hatch flex size-full items-center justify-center text-[13px] text-fg-faint">No photo</div>
        )}
        <span className="absolute left-2 top-2 bg-void/75 px-2 py-1 font-mono text-[11px] backdrop-blur">
          {sub.confidence !== null ? `GEMINI ${Math.round(sub.confidence * 100)}%` : "NO AI VERDICT"}
        </span>
        <span className="absolute right-2 top-2 bg-void/75 px-2 py-1 font-mono text-[11px] backdrop-blur">{sub.ageMinutes < 1 ? "just now" : `${age(sub.ageMinutes)} ago`}</span>
        {done && (
          <span className="absolute inset-0 flex items-center justify-center bg-void/70">
            <span className={`stamp-in flex size-24 items-center justify-center border-4 ${done === "approved" ? "border-blood text-blood" : "border-fg-muted text-fg-muted"}`}>
              <span className="kanji text-[50px]">{done === "approved" ? "祓" : "破"}</span>
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="font-display text-[16px] leading-tight">{sub.questTitle}</p>
          <p className="text-[12px] text-fg-muted">
            {sub.locationName} · {sub.studentName} <span className="font-mono">{sub.studentUid}</span>
          </p>
        </div>
        {sub.reason && <p className="border-l-2 border-cursed pl-2 text-[12px] text-fg-muted">Gemini: {sub.reason}</p>}
        {rejecting && !done && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Tell the student what to fix"
            className="resize-none border border-ink-500 bg-ink-800 px-3 py-2 text-[14px] focus:border-cursed focus:outline-none"
          />
        )}
        {error && <p role="alert" className="text-[13px] text-blood-bright">{error}</p>}
        {!done && (
          <div className="mt-auto flex items-center gap-2">
            {rejecting ? (
              <>
                <button type="button" onClick={() => setRejecting(false)} className={btnClass("ghost", "sm")}>
                  Cancel
                </button>
                <button type="button" disabled={pending || !reason.trim()} onClick={() => decide(false)} className={btnClass("ghost", "sm", "flex-1 border-blood text-blood-bright")}>
                  Reject
                </button>
              </>
            ) : (
              <>
                <button type="button" disabled={pending} onClick={() => setRejecting(true)} className={btnClass("ghost", "sm")}>
                  <X className="size-4" aria-hidden /> Reject
                </button>
                <button type="button" disabled={pending} onClick={() => decide(true)} className={btnClass("blood", "sm", "flex-1")}>
                  <Check className="size-4" aria-hidden /> Approve <Ce value={sub.questCe} sign className="text-[13px]" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
