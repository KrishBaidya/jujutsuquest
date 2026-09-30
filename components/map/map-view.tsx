"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, Crosshair, Images, Lock, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES } from "@/lib/grades";
import type { LocationSummary } from "@/lib/queries/locations";
import type { ResidueThumb } from "@/lib/queries/residue";
import { Ce, btnClass } from "@/components/ui";

// Leaflet touches `window` on import, so the map loads in the browser only.
const VeilMap = dynamic(() => import("./veil-map"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-void">
      <span className="kanji animate-pulse text-[64px] text-cursed/40">帳</span>
    </div>
  ),
});

type Me = { lat: number; lng: number; accuracy: number };

/** Metres between two points (haversine). */
function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function MapView({
  initialLocations,
  residue,
  initialPlace,
}: {
  initialLocations: LocationSummary[];
  residue: Record<string, ResidueThumb>;
  initialPlace?: string;
}) {
  const [locations, setLocations] = useState(initialLocations);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialLocations.find((l) => l.id === initialPlace)?.id ?? initialLocations[0]?.id,
  );
  const [me, setMe] = useState<Me | null>(null);
  const [sensing, setSensing] = useState<"idle" | "on" | "denied">("idle");

  // Re-read the veil when the tab comes back, so a place cleared elsewhere opens up.
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/locations", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { locations: LocationSummary[] };
        if (alive) setLocations(data.locations);
      } catch {
        // offline: keep what we have
      }
    };
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  // Follow the student's position once they ask for it.
  useEffect(() => {
    if (sensing !== "on" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => setSensing("denied"),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [sensing]);

  const cleared = locations.filter((l) => l.cleared).length;
  const place = locations.find((l) => l.id === selectedId);
  const distance = me && place ? metres(me, place) : null;

  return (
    <div className="relative h-[calc(100dvh-56px-68px-env(safe-area-inset-bottom))] min-h-[520px] overflow-hidden lg:h-dvh">
      <VeilMap locations={locations} selectedId={selectedId} onSelect={setSelectedId} me={me} />

      {/* Vignette and grain over the tiles */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[400] bg-[radial-gradient(130%_100%_at_50%_45%,transparent_55%,rgb(3_3_5/0.6))]"
      />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex items-start justify-between gap-3 lg:inset-x-6 lg:top-6">
        <div className="pointer-events-auto border border-ink-500 bg-ink-900/90 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="kanji text-[34px] text-cursed-soft [text-shadow:0_0_18px_var(--color-cursed)]">帳</span>
            <div>
              <h1 className="font-display text-[17px] leading-none tracking-wide">The Veil</h1>
              <p className="mt-1 font-mono text-[11px] tracking-wider text-fg-muted">
                {cleared}/{locations.length} LIFTED
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex gap-1" aria-hidden>
            {locations.map((l) => (
              <span key={l.id} className={cn("h-1 flex-1", l.cleared ? "bg-bone" : "bg-ink-500")} />
            ))}
          </div>
          <ul className="mt-3 hidden flex-col gap-1.5 border-t border-ink-600 pt-2.5 text-[11px] text-fg-muted lg:flex">
            <li className="flex items-center gap-2">
              <span className="kanji w-5 text-center text-[14px] text-cursed-soft">帳</span>
              Curtain around campus
            </li>
            <li className="flex items-center gap-2">
              <span className="kanji w-5 text-center text-[14px] text-cursed">呪</span>
              Cursed spirit: missions open
            </li>
            <li className="flex items-center gap-2">
              <span className="kanji w-5 text-center text-[14px] text-gold">祓</span>
              Exorcised: roped off
            </li>
            <li className="flex items-center gap-2">
              <span className="kanji w-5 text-center text-[14px] text-blood">域</span>
              Selected: domain expanded
            </li>
          </ul>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2 lg:mr-[412px]">
          <button
            type="button"
            onClick={() => setSensing("on")}
            aria-pressed={sensing === "on"}
            className={cn(
              "flex h-11 items-center gap-2 border px-3.5 text-[13px] font-bold backdrop-blur-md transition-colors",
              sensing === "on"
                ? "border-infinity/70 bg-infinity/15 text-infinity"
                : "border-ink-500 bg-ink-900/90 text-fg hover:border-fg-faint",
            )}
          >
            <Crosshair className={cn("size-4", sensing === "on" && !me && "animate-spin")} aria-hidden />
            {sensing === "denied" ? "Location blocked" : sensing === "on" ? (me ? "Sensing you" : "Sensing…") : "Sense me"}
          </button>
          <Compass />
        </div>
      </div>

      {/* Place sheet */}
      <div className="absolute inset-x-0 bottom-0 z-[1000] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:top-6 lg:w-[400px]">
        <div className="flex max-h-[62dvh] flex-col border-t lg:max-h-full border-ink-500 bg-ink-900/95 shadow-[0_-24px_60px_rgb(0_0_0/0.6)] backdrop-blur-md lg:h-full lg:border">
          {/* Place picker */}
          <div className="scrollbar-none flex flex-none gap-1.5 overflow-x-auto border-b border-ink-600 px-3 py-2.5">
            {locations.map((l) => {
              const on = l.id === selectedId;
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSelectedId(l.id)}
                  className={cn(
                    "flex h-8 flex-none items-center gap-1.5 px-2.5 text-[12px] font-bold transition-colors",
                    on ? "bg-bone text-paper-ink" : "text-fg-muted hover:bg-ink-700 hover:text-fg",
                  )}
                >
                  <span className="kanji text-[14px]" style={{ color: on ? undefined : GRADES[l.topGrade].color }}>
                    {l.kanji}
                  </span>
                  {l.name}
                </button>
              );
            })}
          </div>

          {place ? (
            <PlaceCard key={place.id} place={place} residue={residue[place.id]} distance={distance} />
          ) : (
            <p className="p-5 text-fg-muted">No locations have been charted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Compass rose with kanji cardinals. The map is always north-up. */
function Compass() {
  return (
    <svg aria-hidden viewBox="-30 -30 60 60" className="size-[60px] drop-shadow-[0_2px_8px_rgb(0_0_0/0.8)]">
      <circle r="27" fill="rgb(11 10 15 / 0.9)" stroke="var(--color-ink-500)" />
      <circle r="21" fill="none" stroke="var(--color-ink-500)" strokeDasharray="1 3" />
      <path d="M0 -19 L4 0 L0 4 L-4 0 Z" fill="var(--color-blood)" />
      <path d="M0 19 L4 0 L0 -4 L-4 0 Z" fill="var(--color-bone)" opacity="0.7" />
      {[
        ["北", 0, -23],
        ["南", 0, 26],
        ["東", 24.5, 1.5],
        ["西", -24.5, 1.5],
      ].map(([k, x, y]) => (
        <text
          key={k}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={k === "北" ? 9 : 7}
          fill={k === "北" ? "var(--color-blood-bright)" : "var(--color-fg-muted)"}
          style={{ fontFamily: "var(--font-brush)" }}
        >
          {k}
        </text>
      ))}
    </svg>
  );
}

function PlaceCard({
  place,
  residue,
  distance,
}: {
  place: LocationSummary;
  residue?: ResidueThumb;
  distance: number | null;
}) {
  const g = GRADES[place.topGrade];
  const photos = residue?.covers ?? [];
  const count = residue?.count ?? 0;
  const quest = place.nextQuest;
  return (
    <div className="rise flex min-h-0 flex-col gap-3.5 overflow-y-auto p-4 lg:gap-4 lg:p-5">
      <div className="flex items-start gap-3.5">
        <span
          className="relative flex size-[60px] flex-none items-center justify-center overflow-hidden border bg-ink-800 bg-cover bg-center"
          style={{ borderColor: g.color, backgroundImage: place.imageUrl ? `url(${place.imageUrl})` : undefined }}
        >
          <span className="absolute inset-0 bg-void/45" />
          <span className="kanji relative text-[30px] text-bone">{place.kanji}</span>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[21px] leading-tight">{place.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-fg-muted">
            <span className={cn("font-bold uppercase tracking-wider", place.cleared ? "text-bone" : "text-cursed-soft")}>
              {place.cleared ? "Veil lifted" : "Veiled"}
            </span>
            <span>
              {place.questCount} {place.questCount === 1 ? "mission" : "missions"}
            </span>
            <span>
              {count} {count === 1 ? "photo" : "photos"}
            </span>
            {distance !== null && (
              <span className="font-mono text-infinity">
                {distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Residue strip: the location's gallery */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-fg-muted">
            <span className="kanji text-[15px] text-blood">残穢</span>
            Residue
          </p>
          {count > 0 && (
            <Link href={`/places/${place.id}#residue`} className="text-[12px] text-fg-muted hover:text-fg">
              See all {count}
            </Link>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5 max-lg:w-[85%]">
          <Link
            href={`/places/${place.id}/residue`}
            className="group flex aspect-square flex-col items-center justify-center gap-1 border border-dashed border-blood/60 bg-blood/5 text-blood transition-colors hover:border-blood hover:bg-blood/15"
          >
            <Camera className="size-5 transition-transform group-hover:scale-110" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wider">Add</span>
          </Link>
          {photos.slice(0, 3).map((src, i) => (
            <Link
              key={src + i}
              href={`/places/${place.id}#residue`}
              className="relative aspect-square overflow-hidden bg-ink-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- signed bucket URLs */}
              <img src={src} alt="" className="size-full object-cover transition-transform duration-500 hover:scale-110" />
              {i === 2 && count > 3 && (
                <span className="absolute inset-0 flex items-center justify-center bg-void/60 font-display text-[15px]">
                  +{count - 3}
                </span>
              )}
            </Link>
          ))}
          {photos.length === 0 && (
            <p className="col-span-3 flex items-center px-2 text-[12px] leading-snug text-fg-faint">
              No one has left a photo here yet. Be the first.
            </p>
          )}
        </div>
      </div>

      {/* Next mission */}
      {quest ? (
        <Link href={`/quests/${quest.id}`} className="paper group hidden items-center gap-3 px-4 py-3 lg:flex">
          <span className="kanji text-[26px] text-blood">任</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] leading-tight">{quest.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-paper-muted">
              {quest.verification === "qr" ? <QrCode className="size-3.5" aria-hidden /> : <Camera className="size-3.5" aria-hidden />}
              {quest.verification === "qr" ? "Scan the seal" : "Photo proof"}
            </p>
          </div>
          <Ce value={quest.ce} sign className="text-[18px] text-blood" />
        </Link>
      ) : (
        <p className="hidden items-center gap-2 border border-dashed border-ink-500 px-3.5 py-3 text-[13px] text-fg-muted lg:flex">
          <Lock className="size-4" aria-hidden />
          {place.cleared ? "Every curse here is exorcised." : "No mission is posted here right now."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link href={`/places/${place.id}`} className={btnClass("ghost", "md")}>
          <Images className="size-4" aria-hidden />
          Open place
        </Link>
        <Link href={`/places/${place.id}/residue`} className={btnClass("blood", "md")}>
          Leave residue
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
