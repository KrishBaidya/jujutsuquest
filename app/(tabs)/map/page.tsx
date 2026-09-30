import type { Metadata } from "next";
import Link from "next/link";
import { Crosshair, Footprints, Images } from "lucide-react";
import { GRADES } from "@/lib/grades";
import { veilPins, questById } from "@/lib/mock-data";
import { Action, GradePill, Kanji } from "@/components/app/primitives";

export const metadata: Metadata = { title: "The veil · Cursed Mission Board" };

const CLEARED = [
  { x: 25, y: 29, r: 64 },
  { x: 73, y: 19, r: 50 },
  { x: 34, y: 58, r: 56 },
];

const mask = CLEARED.map(
  (c) => `radial-gradient(circle at ${c.x}% ${c.y}%, transparent ${c.r - 2}px, #000 ${c.r + 2}px)`,
).join(",");

export default function MapPage() {
  const quest = questById("fountain-walk")!;
  return (
    <div className="relative h-[calc(100dvh-88px)] min-h-[560px] overflow-hidden bg-night-950 lg:h-[calc(100dvh-72px)]">
      <div className="map-tiles absolute inset-0" />
      <div className="absolute left-[15%] top-[26%] h-[46px] w-[70px] bg-[#2c2650]" />
      <div className="absolute left-[64%] top-[15%] size-[60px] bg-[#2c2650]" />
      <div className="absolute left-[23%] top-[56%] h-10 w-[90px] bg-[#2c2650]" />
      <span className="absolute left-6 top-[50%] font-mono text-[13px] text-mist-500">campus map tiles</span>

      {/* the veil: everything outside a cleared circle is covered */}
      <div
        aria-hidden
        className="absolute inset-0 bg-night-950/90 bg-grid-night"
        style={{
          backgroundColor: "rgba(12,9,25,0.9)",
          maskImage: mask,
          WebkitMaskImage: mask,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      {CLEARED.map((c) => (
        <div
          key={`${c.x}-${c.y}`}
          aria-hidden
          className="absolute rounded-full border border-dashed border-washi-100/40"
          style={{ left: `calc(${c.x}% - ${c.r}px)`, top: `calc(${c.y}% - ${c.r}px)`, width: c.r * 2, height: c.r * 2 }}
        />
      ))}

      {veilPins.map((p) => (
        <div
          key={p.grade}
          className="absolute flex -translate-x-1/2 flex-col items-center gap-1"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <span
            className="size-[22px] rounded-full shadow-[0_0_0_3px_#0C0919]"
            style={{ background: GRADES[p.grade].color }}
          />
          <span className="rounded-full bg-night-800 px-[7px] py-px text-[13px] font-bold">
            {GRADES[p.grade].label}
          </span>
        </div>
      ))}

      {/* active geofence + you */}
      <div className="absolute left-[54%] top-[44%] size-[120px] rounded-full border-2 border-cursed-500 bg-[radial-gradient(circle,rgba(122,92,255,0.25),transparent_70%)] shadow-[0_0_30px_rgba(122,92,255,0.5)]" />
      <div className="absolute left-[calc(54%+52px)] top-[calc(44%+52px)] size-4 rounded-full bg-azure-500 shadow-[0_0_0_4px_rgba(76,155,255,0.3),inset_0_0_0_2px_#EEE8FA]" />

      <div className="absolute inset-x-4 top-4 flex items-center justify-between lg:inset-x-6 lg:top-6">
        <div className="flex h-12 items-center gap-2.5 rounded-full border border-night-700 bg-night-800/95 px-4">
          <Kanji className="text-[22px]">帳</Kanji>
          <div className="flex flex-col leading-[1.2]">
            <span className="font-display text-base font-extrabold">The veil</span>
            <span className="text-[13px] text-mist-300">3 cleared · 9 veiled</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/locations"
            className="flex h-12 items-center gap-2 rounded-full border border-night-700 bg-night-800/95 px-4 text-[13px] font-bold"
          >
            <Images className="size-[18px]" aria-hidden />
            Sites
          </Link>
          <button
            type="button"
            aria-label="Centre on my location"
            className="flex size-12 items-center justify-center rounded-full border border-night-700 bg-night-800/95"
          >
            <Crosshair className="size-[22px]" />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3.5 rounded-t-[20px] border-t border-night-600 bg-night-800 px-5 pb-[18px] pt-2.5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] lg:inset-x-auto lg:bottom-6 lg:left-6 lg:w-[400px] lg:rounded-2xl lg:border lg:pb-5">
        <span className="h-1 w-10 self-center rounded-sm bg-night-700 lg:hidden" />
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg border border-cursed-500 bg-night-950">
            <Kanji className="text-2xl">帳</Kanji>
          </span>
          <div className="flex flex-col">
            <h2 className="font-display text-xl font-extrabold">Mission active here</h2>
            <span className="text-[13px] text-mist-300">You&apos;re inside the fountain curtain</span>
          </div>
        </div>
        <div className="paper flex items-center justify-between gap-2.5 rounded px-3.5 py-3">
          <div className="flex flex-col gap-1">
            <span className="font-display text-[17px] font-extrabold leading-[1.3]">{quest.title}</span>
            <span className="flex items-center gap-2 text-[13px] text-sumi-600">
              <GradePill grade={quest.grade} className="h-auto border-0 bg-transparent p-0" />
              <span className="flex items-center gap-[3px]">
                <Footprints className="size-3.5" aria-hidden />
                Walk 600 m
              </span>
            </span>
          </div>
          <span className="flex-none font-display text-xl font-extrabold text-seal-600">+{quest.ce} CE</span>
        </div>
        <Action href={`/quests/${quest.id}`} size="md" className="h-[52px] text-[17px]">
          Accept mission
        </Action>
      </div>
    </div>
  );
}
