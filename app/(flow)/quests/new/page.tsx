"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Footprints, QrCode, X } from "lucide-react";
import { CATEGORIES, type CategoryKey, type Verification } from "@/lib/mock-data";
import { Action, Chip, Kanji, Segmented } from "@/components/app/primitives";
import { Stage } from "@/components/app/shell";
import { BACK } from "@/components/app/transitions";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-lg border border-night-700 bg-night-800 px-3.5 text-mist-100 outline-none placeholder:text-mist-500 focus-visible:border-cursed-500 focus-visible:ring-[3px] focus-visible:ring-cursed-500/20";

// Mock of Jev's suggestion; a real build would call the grading service.
const SUGGESTED = 3 as const;

export default function CreateQuestPage() {
  const [title, setTitle] = useState("Feed the koi at the east pond");
  const [description, setDescription] = useState(
    "Ask the groundskeeper for fish food at the shed, then feed the koi.",
  );
  const [category, setCategory] = useState<CategoryKey>("wellness");
  const [verification, setVerification] = useState<Verification>("photo");
  const [picked] = useState<3 | 4>(4);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sent, setSent] = useState<3 | 4 | null>(null);

  const canSubmit = title.trim().length > 2 && description.trim().length > 5;

  if (sent) {
    return (
      <Stage width="form">
      <div className="rise-in flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-16 text-center">
        <Kanji className="text-6xl text-cursed-300">審</Kanji>
        <h1 className="font-display text-2xl font-extrabold">Sent for review</h1>
        <p className="text-[15px] leading-[1.6] text-mist-300">
          &ldquo;{title}&rdquo; goes to a senior sorcerer as a Grade {sent} quest.
        </p>
        <Action href="/board" back size="md" className="mt-4 w-full max-w-[320px]">
          Back to board
        </Action>
      </div>
      </Stage>
    );
  }

  return (
    <Stage width="form">
      <header className="flex items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+16px)] lg:px-6 lg:pt-6">
        <Link href="/board" transitionTypes={BACK} aria-label="Close" className="flex size-11 items-center justify-center rounded-full hover:bg-night-800">
          <X className="size-[22px]" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold">Create quest</h1>
      </header>

      <form
        className="flex flex-1 flex-col gap-4 px-5 py-3.5 lg:gap-5 lg:px-8 lg:pb-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) setSuggestOpen(true);
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mist-300">Title</span>
          <input
            className={cn(inputCls, "h-[50px] text-base")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mist-300">Description</span>
          <textarea
            className={cn(inputCls, "min-h-[72px] py-3 text-[15px] leading-normal")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <div role="group" aria-label="Category" className="flex flex-col gap-2">
          <span className="text-[13px] text-mist-300">Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.key !== "event").map((c) => (
              <Chip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
                <Kanji className="text-[15px]">{c.k}</Kanji>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative h-[60px] w-[84px] flex-none rounded bg-[#1f1a38] bg-[repeating-linear-gradient(28deg,transparent_0_14px,#342d5c_14px_16px)]">
            <span className="absolute left-9 top-[22px] size-3 rounded-full bg-cursed-300 shadow-[0_0_0_3px_#110D22]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-mist-300">Location</span>
            <span className="text-[15px] font-bold">East pond · 120 m away</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-mist-300">Verification</span>
          <Segmented
            label="Verification"
            value={verification}
            onChange={setVerification}
            items={[
              { value: "photo", label: <><Camera className="size-4" aria-hidden />Photo</> },
              { value: "qr", label: <><QrCode className="size-4" aria-hidden />QR</> },
              { value: "walk", label: <><Footprints className="size-4" aria-hidden />Walk</> },
            ]}
          />
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Action type="submit" size="md" disabled={!canSubmit}>
            Submit for review · Grade {picked}
          </Action>
        </div>
      </form>

      {suggestOpen && (
        <>
          <div className="fixed inset-0 z-[1200] bg-night-950/55 lg:bg-night-950/70 lg:backdrop-blur-sm" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="jev-title"
            className="sheet-in fixed inset-x-0 bottom-0 z-[1210] mx-auto flex w-full max-w-[430px] flex-col gap-4 rounded-t-[20px] border-t border-night-600 bg-night-800 px-[22px] pb-[34px] pt-2.5 lg:bottom-auto lg:top-1/2 lg:max-w-[460px] lg:-translate-y-1/2 lg:rounded-2xl lg:border lg:p-7"
          >
            <span className="h-1 w-10 self-center rounded-sm bg-night-700 lg:hidden" />
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full border border-cursed-500 bg-night-700 font-bold text-cursed-300">
                Jev
              </span>
              <div className="flex flex-col">
                <h2 id="jev-title" className="font-display text-xl font-extrabold leading-tight">
                  Jev suggests Grade {SUGGESTED}
                </h2>
                <span className="text-[13px] text-mist-300">
                  86% confident · you picked Grade {picked}
                </span>
              </div>
            </div>
            <p className="text-[15px] leading-[1.6] text-mist-300">
              Getting the fish food needs a conversation with staff, which puts it above a Grade 4 walk.
            </p>
            <div className="grid grid-cols-[1fr_1.3fr] gap-2.5">
              <Action variant="secondary" size="md" onClick={() => setSent(picked)}>
                Keep Grade {picked}
              </Action>
              <Action size="md" onClick={() => setSent(SUGGESTED)}>
                Use Grade {SUGGESTED}
              </Action>
            </div>
            <span className="text-center text-[13px] text-mist-500">
              Your quest then goes to pending review.
            </span>
          </div>
        </>
      )}
    </Stage>
  );
}
