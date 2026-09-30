"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronLeft, X } from "lucide-react";
import { rejectReasons, reviewQueue } from "@/lib/mock-data";
import { Action, Chip, Kanji } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";
import { BACK } from "@/components/app/transitions";
import { cn } from "@/lib/utils";

export default function ReviewQueuePage() {
  const [index, setIndex] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const [earned, setEarned] = useState(0);
  const [verdicts, setVerdicts] = useState<("approved" | "rejected")[]>([]);

  const total = reviewQueue.length;
  const item = reviewQueue[index];
  const done = index >= total;

  const decide = (verdict: "approved" | "rejected") => {
    setVerdicts((v) => [...v, verdict]);
    setEarned((e) => e + 10);
    setReason(null);
    setIndex((i) => i + 1);
  };

  return (
    <Page className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+16px)] lg:px-0 lg:pt-0">
        <Link
          href="/me"
          transitionTypes={BACK}
          aria-label="Back to profile"
          className="flex size-11 items-center justify-center rounded-full hover:bg-night-800"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <Kanji className="text-[30px] leading-none lg:text-[40px]">審</Kanji>
        <div className="flex flex-col">
          <h1 className="font-display text-[22px] font-extrabold leading-[1.1] lg:text-[28px]">Review queue</h1>
          <span className="text-[13px] text-mist-300">
            {done ? "All clear" : `${total - index} waiting · ${index + 1} of ${total}`}
          </span>
        </div>
      </header>

      {done ? (
        <div className="rise-in mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center gap-3 px-8 pb-24 text-center lg:py-24">
          <span className="stamp-in flex size-24 items-center justify-center rounded-[14px] bg-seal-600 shadow-[inset_0_0_0_5px_#D8392B,inset_0_0_0_7px_#EFE9DC]">
            <Kanji className="text-[56px] leading-none text-washi-100">祓</Kanji>
          </span>
          <p className="mt-2 font-display text-2xl font-extrabold">Queue cleared</p>
          <p className="text-[15px] text-mist-300">You earned +{earned} CE for fair reviews.</p>
          <Action href="/me" back size="md" className="mt-4 w-full">
            Back to profile
          </Action>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-5 pb-[30px] pt-[18px] lg:grid lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:items-start lg:gap-8 lg:px-0 lg:pb-0 lg:pt-8">
          {/* desktop: the whole queue */}
          <ol className="hidden flex-col gap-1 lg:flex">
            {reviewQueue.map((q, i) => (
              <li
                key={q.title}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px]",
                  i === index && "bg-night-800 shadow-[inset_0_0_0_1px_#3D8BFF]",
                  i < index && "text-mist-500",
                )}
              >
                <span className="flex size-6 flex-none items-center justify-center rounded-full border border-night-600 font-display text-[13px] font-extrabold">
                  {verdicts[i] === "approved" ? (
                    <Check className="size-3.5 text-jade-500" aria-label="Approved" />
                  ) : verdicts[i] === "rejected" ? (
                    <X className="size-3.5 text-flash-500" aria-label="Rejected" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-bold">{q.title}</span>
                  <span className="truncate text-mist-500">
                    {q.by} · {q.ago}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <article
            key={index}
            className="rise-in flex flex-col gap-3.5 rounded bg-washi-100 p-4 text-sumi-900 shadow-[inset_0_0_0_1px_#DDD5C3] lg:p-6"
          >
            <div className="flex flex-col">
              <h2 className="font-display text-[17px] font-extrabold leading-[1.3] lg:text-2xl">{item.title}</h2>
              <span className="text-[13px] text-sumi-600">
                {item.by} · {item.grade} · {item.ago}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
              {[
                { tag: "submitted", cap: item.cap },
                { tag: "reference", cap: item.ref },
              ].map((p) => (
                <div key={p.tag} className="flex flex-col gap-1.5">
                  <div className="placeholder-photo flex h-[150px] items-end rounded p-2 lg:h-[260px]">
                    <span className="font-mono text-[13px] text-sumi-600">{p.tag}</span>
                  </div>
                  <span className="text-[13px] text-sumi-600">{p.cap}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5 rounded bg-washi-300 p-3">
              <div className="flex justify-between text-[13px]">
                <span className="font-bold">Jev&apos;s confidence</span>
                <span className="font-display text-[15px] font-extrabold">{item.conf}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-washi-500 shadow-[inset_0_0_0_1px_#c4baa3]">
                <div className="gauge-fill h-full bg-cursed-500" style={{ width: `${item.conf}%` }} />
              </div>
              <span className="text-[13px] text-sumi-600">{item.note}</span>
            </div>
          </article>

          <div className="flex flex-1 flex-col gap-4 lg:sticky lg:top-[104px] lg:flex-none lg:rounded-lg lg:border lg:border-night-700 lg:bg-night-800 lg:p-5">
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-[13px] text-mist-300">Reason, if you reject</legend>
              <div className="flex flex-wrap gap-2">
                {rejectReasons.map((r) => {
                  const on = reason === r;
                  return (
                    <Chip key={r} active={on} onClick={() => setReason(on ? null : r)}>
                      {on && <Check className="size-3.5" aria-hidden />}
                      {r}
                    </Chip>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-auto grid grid-cols-[1fr_1.4fr] gap-2.5 lg:mt-2">
              <button
                type="button"
                disabled={!reason}
                onClick={() => decide("rejected")}
                className={cn(
                  "flex h-[54px] items-center justify-center gap-1.5 rounded-lg border border-mist-500 text-[15px] font-bold transition-colors hover:bg-night-700 active:translate-y-px",
                  !reason && "pointer-events-none border-night-700 bg-night-700 text-mist-500",
                )}
              >
                <X className="size-4" aria-hidden />
                Reject
              </button>
              <Action onClick={() => decide("approved")} className="h-[54px]">
                <Check className="size-4" aria-hidden />
                Approve
              </Action>
            </div>
            <span className="text-center text-[13px] text-mist-500">
              Each fair review earns you +10 CE{earned ? ` · +${earned} so far` : ""}
            </span>
          </div>
        </div>
      )}
    </Page>
  );
}
