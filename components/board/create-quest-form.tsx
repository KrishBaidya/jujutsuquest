"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Camera, MapPin, QrCode, X } from "lucide-react";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import type { VerificationMethod } from "@/lib/db/schema";
import { createQuest } from "@/lib/actions/quests";
import { Action, Chip, Kanji, Segmented } from "@/components/app/primitives";
import { Stage } from "@/components/app/shell";
import { BACK } from "@/components/app/transitions";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-lg border border-night-700 bg-night-800 px-3.5 text-mist-100 outline-none placeholder:text-mist-500 focus-visible:border-cursed-500 focus-visible:ring-[3px] focus-visible:ring-cursed-500/20";

export function CreateQuestForm({ locations }: { locations: { id: string; name: string }[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryKey>("wellness");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [verification, setVerification] = useState<VerificationMethod>("photo");
  const [verifyHint, setVerifyHint] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const canSubmit = title.trim().length > 2 && description.trim().length > 5 && !!locationId && !pending;

  if (sent) {
    return (
      <Stage width="form">
        <div className="rise-in flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-16 text-center">
          <Kanji className="text-6xl text-cursed-300">審</Kanji>
          <h1 className="font-display text-2xl font-extrabold">Sent for review</h1>
          <p className="text-[15px] leading-[1.6] text-mist-300">
            &ldquo;{title}&rdquo; goes to a senior sorcerer as a Grade 4 quest.
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
          if (!canSubmit) return;
          setError(null);
          start(async () => {
            const res = await createQuest({ title, description, category, locationId, verification, verifyHint });
            if (res.ok) setSent(true);
            else setError(res.error);
          });
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mist-300">Title</span>
          <input
            className={cn(inputCls, "h-[50px] text-base")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Feed the koi at the east pond"
            maxLength={80}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mist-300">Description</span>
          <textarea
            className={cn(inputCls, "min-h-[72px] py-3 text-[15px] leading-normal")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should a student do?"
            maxLength={600}
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

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[13px] text-mist-300">
            <MapPin className="size-3.5" aria-hidden />
            Location
          </span>
          <select
            className={cn(inputCls, "h-[50px] text-base")}
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-mist-300">Verification</span>
          <Segmented
            label="Verification"
            value={verification}
            onChange={setVerification}
            items={[
              { value: "photo", label: <><Camera className="size-4" aria-hidden />Photo</> },
              { value: "qr", label: <><QrCode className="size-4" aria-hidden />QR</> },
            ]}
          />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mist-300">Verification hint</span>
          <input
            className={cn(inputCls, "h-[50px] text-base")}
            value={verifyHint}
            onChange={(e) => setVerifyHint(e.target.value)}
            placeholder={verification === "qr" ? "Scan the code on the notice board" : "Frame the pond with the bridge in view"}
            maxLength={200}
          />
        </label>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          {error && (
            <span role="alert" className="text-center text-[13px] text-ember-500">
              {error}
            </span>
          )}
          <Action type="submit" size="md" disabled={!canSubmit}>
            {pending ? "Sending..." : "Submit for review"}
          </Action>
        </div>
      </form>
    </Stage>
  );
}
