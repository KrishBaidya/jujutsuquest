"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronLeft, X } from "lucide-react";
import { rejectReasons, reviewQueue } from "@/lib/mock-data";
import { Action, Chip, Kanji } from "@/components/app/primitives";
import { cn } from "@/lib/utils";

export default function ReviewQueuePage() {
  const [index, setIndex] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const [earned, setEarned] = useState(0);

  const total = reviewQueue.length;
  const item = reviewQueue[index];
  const done = index >= total;

  const next = () => {
    setEarned((e) => e + 10);
    setReason(null);
    setIndex((i) => i + 1);
  };

  return (
    <>
      <header className="flex items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+16px)]">
        <Link href="/me" aria-label="Back" className="flex size-11 items-center justify-center">
          <ChevronLeft className="size-6" />
        </Link>
        <Kanji className="text-[30px] leading-none">審</Kanji>
        <div className="flex flex-col">
          <h1 className="font-display text-[22px] font-extrabold leading-[1.1]">Review queue</h1>
          <span className="text-[13px] text-mist-300">
            {done ? "All clear" : `${total - index} waiting · ${index + 1} of ${total}`}
          </span>
        </div>
      </header>

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-24 text-center">
          <Kanji className="text-6xl text-cursed-300">祓</Kanji>
          <p className="font-display text-2xl font-extrabold">Queue cleared</p>
          <p className="text-[15px] text-mist-300">You earned +{earned} CE for fair reviews.</p>
          <Action href="/me" size="md" className="mt-4 w-full">
            Back to profile
          </Action>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-5 pb-[30px] pt-[18px]">
          <article className="flex flex-col gap-3.5 rounded bg-washi-100 p-4 text-sumi-900 shadow-[inset_0_0_0_1px_#E0CFA6]">
            <div className="flex flex-col">
              <h2 className="font-display text-[17px] font-extrabold leading-[1.3]">{item.title}</h2>
              <span className="text-[13px] text-sumi-600">
                {item.by} · {item.grade} · {item.ago}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { tag: "submitted", cap: item.cap },
                { tag: "reference", cap: item.ref },
              ].map((p) => (
                <div key={p.tag} className="flex flex-col gap-1.5">
                  <div className="placeholder-photo flex h-[150px] items-end rounded p-2">
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
              <div className="h-2 overflow-hidden rounded-full bg-washi-500 shadow-[inset_0_0_0_1px_#cdbb8f]">
                <div className="h-full bg-cursed-500" style={{ width: `${item.conf}%` }} />
              </div>
              <span className="text-[13px] text-sumi-600">{item.note}</span>
            </div>
          </article>

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

          <div className="mt-auto grid grid-cols-[1fr_1.4fr] gap-2.5">
            <button
              type="button"
              disabled={!reason}
              onClick={next}
              className={cn(
                "flex h-[54px] items-center justify-center gap-1.5 rounded-lg border border-mist-500 text-[15px] font-bold",
                !reason && "border-night-700 bg-night-700 text-mist-500",
              )}
            >
              <X className="size-4" aria-hidden />
              Reject
            </button>
            <Action onClick={next} className="h-[54px]">
              <Check className="size-4" aria-hidden />
              Approve
            </Action>
          </div>
          <span className="text-center text-[13px] text-mist-500">
            Each fair review earns you +10 CE{earned ? ` · +${earned} so far` : ""}
          </span>
        </div>
      )}
    </>
  );
}
