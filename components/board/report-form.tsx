"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Camera, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { createQuest } from "@/lib/actions/quests";
import { btnClass } from "@/components/ui";
import type { VerificationMethod } from "@/lib/db/schema";

const input =
  "w-full border border-ink-500 bg-ink-800 px-3.5 text-[15px] placeholder:text-fg-faint focus:border-cursed focus:outline-none focus:ring-2 focus:ring-cursed/30";

export function ReportForm({ locations }: { locations: { id: string; name: string }[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryKey>("explore");
  const [locationId, setLocationId] = useState("");
  const [verification, setVerification] = useState<VerificationMethod>("photo");
  const [verifyHint, setVerifyHint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="seal stamp-in size-24 text-[44px]">報</span>
        <p className="font-display text-[22px]">Report filed</p>
        <p className="max-w-sm text-fg-muted">A senior sorcerer will grade it. Once approved it goes on the board for everyone.</p>
        <Link href="/board" className={btnClass("blood", "md")}>
          Back to missions
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await createQuest({ title, description, category, locationId, verification, verifyHint });
          if (!res.ok) setError(res.error);
          else setSent(true);
        });
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="A curse under the library stairs" className={cn(input, "h-12")} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">What should a sorcerer do?</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} rows={4} placeholder="Where to go and what to find." className={cn(input, "resize-none py-2.5")} />
      </label>

      <fieldset>
        <legend className="mb-2 text-[13px] font-bold">Kind</legend>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={category === c.key}
              onClick={() => setCategory(c.key)}
              className={cn(
                "flex flex-col items-center gap-1 border py-2.5 transition-colors",
                category === c.key ? "border-bone bg-bone text-paper-ink" : "border-ink-500 text-fg-muted hover:border-fg-faint",
              )}
            >
              <span className="kanji text-[22px]">{c.k}</span>
              <span className="text-[11px] font-bold">{c.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">Location</span>
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={cn(input, "h-12")}>
          <option value="">Choose a place…</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="mb-2 text-[13px] font-bold">Proof</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["photo", Camera, "Photo", "Checked by Gemini"],
              ["qr", QrCode, "Seal scan", "Needs a printed QR on site"],
            ] as const
          ).map(([key, Icon, label, sub]) => (
            <button
              key={key}
              type="button"
              aria-pressed={verification === key}
              onClick={() => setVerification(key)}
              className={cn(
                "flex items-center gap-3 border p-3 text-left transition-colors",
                verification === key ? "border-blood bg-blood/10" : "border-ink-500 hover:border-fg-faint",
              )}
            >
              <Icon className="size-5 flex-none" aria-hidden />
              <span>
                <span className="block text-[14px] font-bold">{label}</span>
                <span className="block text-[11px] text-fg-muted">{sub}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">
          Binding vow <span className="font-normal text-fg-faint">— what the proof must show</span>
        </span>
        <input value={verifyHint} onChange={(e) => setVerifyHint(e.target.value)} maxLength={200} placeholder="The stair railing with the red sign behind it" className={cn(input, "h-12")} />
      </label>

      {error && (
        <p role="alert" className="border-l-2 border-blood bg-blood/10 px-3 py-2 text-[14px]">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className={btnClass("blood", "lg", "w-full sm:w-auto sm:self-start")}>
        {pending ? "Filing…" : "File the report"}
      </button>
    </form>
  );
}
