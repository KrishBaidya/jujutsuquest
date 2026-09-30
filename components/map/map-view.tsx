"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Crosshair, Images, Lock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES } from "@/lib/grades";
import { ACTIVE_PLACE, campusPlaces, placeById } from "@/lib/campus";
import { questById } from "@/lib/mock-data";
import { Action, GradePill, Kanji } from "@/components/app/primitives";
import { Scroller } from "@/components/app/scroller";
import { FORWARD } from "@/components/app/transitions";

// Leaflet reads `window` at import time, so the map only loads in the browser.
const CampusMap = dynamic(() => import("./campus-map"), {
  ssr: false,
  loading: () => (
    <div className="map-tiles absolute inset-0 flex items-center justify-center">
      <span className="rounded-full bg-night-800 px-4 py-2 text-[13px] text-mist-300">
        Lifting the veil…
      </span>
    </div>
  ),
});

const clearedCount = campusPlaces.filter((p) => p.cleared).length;

export function MapView({ initialPlace }: { initialPlace?: string }) {
  const [selectedId, setSelectedId] = useState(placeById(initialPlace)?.id ?? ACTIVE_PLACE);
  const [locateTick, setLocateTick] = useState(0);

  const place = placeById(selectedId)!;
  const quest = place.questId ? questById(place.questId) : undefined;
  const isActive = place.id === ACTIVE_PLACE;
  const grade = GRADES[place.grade];

  return (
    <div className="relative h-[calc(100dvh-88px)] min-h-[560px] overflow-hidden bg-night-950 lg:h-[calc(100dvh-72px)]">
      <CampusMap selectedId={selectedId} onSelect={setSelectedId} locateTick={locateTick} />

      <div className="pointer-events-none absolute inset-x-4 top-[calc(env(safe-area-inset-top)+16px)] z-[1000] flex items-center justify-between lg:inset-x-6 lg:top-6">
        <div className="pointer-events-auto flex h-12 items-center gap-2.5 rounded-full border border-night-700 bg-night-800/95 px-4">
          <Kanji className="text-[22px]">帳</Kanji>
          <div className="flex flex-col leading-[1.2]">
            <span className="font-display text-base font-extrabold">The veil</span>
            <span className="text-[13px] text-mist-300">
              {clearedCount} cleared · {campusPlaces.length - clearedCount} veiled
            </span>
          </div>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <Link
            href="/locations"
            transitionTypes={FORWARD}
            className="flex h-12 items-center gap-2 rounded-full border border-night-700 bg-night-800/95 px-4 text-[13px] font-bold hover:bg-night-700"
          >
            <Images className="size-[18px]" aria-hidden />
            Sites
          </Link>
          <button
            type="button"
            aria-label="Centre on my location"
            onClick={() => setLocateTick((t) => t + 1)}
            className="flex size-12 items-center justify-center rounded-full border border-night-700 bg-night-800/95 hover:bg-night-700"
          >
            <Crosshair className="size-[22px]" />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[1000] flex flex-col gap-3 rounded-t-[20px] border-t border-night-600 bg-night-800 pb-[18px] pt-2.5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] lg:inset-x-auto lg:bottom-6 lg:left-6 lg:w-[420px] lg:rounded-2xl lg:border lg:pb-5">
        <span className="h-1 w-10 self-center rounded-sm bg-night-700 lg:hidden" />

        <Scroller label="Campus places" arrows={false} trackClassName="gap-2 px-5">
          {campusPlaces.map((p) => {
            const on = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors",
                  on ? "bg-washi-100 font-bold text-sumi-900" : "border border-night-700 bg-night-900",
                )}
              >
                <span className="size-2 rounded-full" style={{ background: GRADES[p.grade].color }} />
                {p.name}
              </button>
            );
          })}
        </Scroller>

        <div key={place.id} className="sheet-in flex flex-col gap-3 px-5">
          <div className="flex items-center gap-3">
            {place.image ? (
              <Image
                src={place.image}
                alt=""
                width={56}
                height={56}
                className="size-14 flex-none rounded-lg border border-night-600 object-cover"
              />
            ) : (
              <span
                className="flex size-14 flex-none items-center justify-center rounded-lg border bg-night-950"
                style={{ borderColor: grade.color }}
              >
                <Kanji className="text-2xl">{place.kanji}</Kanji>
              </span>
            )}
            <div className="flex min-w-0 flex-col">
              <h2 className="font-display text-xl font-extrabold leading-tight">
                {isActive ? "Mission active here" : place.name}
              </h2>
              <span className="flex items-center gap-1.5 text-[13px] text-mist-300">
                {isActive ? (
                  "You're inside the fountain curtain"
                ) : (
                  <>
                    <MapPin className="size-3.5" aria-hidden />
                    {place.distance} · {place.cleared ? "Veil lifted" : "Still veiled"}
                  </>
                )}
              </span>
            </div>
          </div>

          {!isActive && <p className="text-[15px] leading-[1.6] text-mist-300">{place.note}</p>}

          {quest ? (
            <>
              <div className="paper flex items-center justify-between gap-2.5 rounded px-3.5 py-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-display text-[17px] font-extrabold leading-[1.3]">{quest.title}</span>
                  <GradePill grade={quest.grade} className="h-auto border-0 p-0" />
                </div>
                <span className="flex-none font-display text-xl font-extrabold text-seal-600">
                  +{quest.ce} CE
                </span>
              </div>
              <Action href={`/quests/${quest.id}`} size="md" className="text-[17px]">
                {isActive ? "Accept mission" : "View mission"}
              </Action>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded border border-dashed border-night-600 px-3.5 py-3 text-[13px] text-mist-300">
              <Lock className="size-4" aria-hidden />
              {place.cleared
                ? "No mission posted here right now."
                : `Reach ${grade.label} to see what waits here.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
