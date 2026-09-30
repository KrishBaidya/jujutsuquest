"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { GRADES } from "@/lib/grades";
import { CAMPUS_CENTER, ring } from "@/lib/campus";
import type { LocationSummary } from "@/lib/queries/locations";

/** The barrier (帳) drawn around campus. */
const BARRIER_RADIUS = 950;
const CLEARED_RADIUS = 75;
const WORLD: [number, number][] = [
  [30.6, 76.4],
  [30.6, 76.75],
  [30.95, 76.75],
  [30.95, 76.4],
];
/** The curtain's incantation, written around the barrier's edge. */
const CHANT = "闇より出でて闇より黒く・その穢れを禊ぎ祓え・";

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Stable pseudo-random numbers from a string, so spirits don't jump between renders. */
function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Point `m` metres from a position at `deg` degrees clockwise from north. */
function offset(lat: number, lng: number, m: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [lat + (m * Math.cos(a)) / 111_320, lng + (m * Math.sin(a)) / (111_320 * Math.cos((lat * Math.PI) / 180))];
}

function ofuda(place: LocationSummary, active: boolean) {
  const glow = GRADES[place.topGrade].glow;
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="ofuda-pin" style="--c:${glow}" data-cleared="${place.cleared}" data-active="${active}">
      <div class="strip"><b>${escapeHtml(place.kanji)}</b><i></i></div>
      <div class="stake"></div>
      <div class="ground"></div>
      ${place.cleared ? '<span class="exorcised">祓</span>' : ""}
      <span class="label">${escapeHtml(place.name)}</span>
    </div>`,
  });
}

const chantIcon = (ch: string, deg: number) =>
  L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<span class="chant-char" style="--r:${deg}deg">${ch}</span>`,
  });

/** Domain Expansion circle under the selected place. */
const domainIcon = (glow: string) =>
  L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="domain" style="--c:${glow}">
      <svg viewBox="-100 -100 200 200" aria-hidden="true">
        <defs><path id="domain-path" d="M 0,-80 A 80,80 0 1,1 -0.01,-80" /></defs>
        <g class="outer">
          <circle r="92" />
          <circle r="80" class="thin" />
          <text><textPath href="#domain-path">領域展開・領域展開・領域展開・領域展開・</textPath></text>
        </g>
        <g class="inner">
          <circle r="56" class="dash" />
          <polygon points="0,-56 48.5,28 -48.5,28" />
          <polygon points="0,56 48.5,-28 -48.5,-28" />
        </g>
      </svg>
    </div>`,
  });

function spiritIcon(glow: string, delay: number, duration: number, size: number) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="spirit" style="--c:${glow};--d:${delay}s;--t:${duration}s;--s:${size}px">
      <svg viewBox="0 0 40 44" aria-hidden="true">
        <path class="body" d="M20 2C9 2 4 11 4 21c0 7 1 14 3 19l4-4 3 5 3-5 3 5 3-5 3 5 3-5 4 4c2-5 3-12 3-19C36 11 31 2 20 2z"/>
        <ellipse class="eye" cx="20" cy="18" rx="7" ry="5"/>
        <circle class="pupil" cx="20" cy="18" r="2.4"/>
      </svg>
    </div>`,
  });
}

function FlyTo({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    // Keep the pin above the bottom sheet on phones.
    const offsetY = window.innerWidth < 1024 ? map.getSize().y * 0.18 : 0;
    const zoom = Math.max(map.getZoom(), 17);
    const target = map.project([lat, lng], zoom).add([window.innerWidth >= 1024 ? 200 : 0, offsetY]);
    map.flyTo(map.unproject(target, zoom), zoom, { duration: 0.8 });
  }, [map, lat, lng]);
  return null;
}

/** The incantation, one character every ~28px around the barrier at the current zoom. */
function Chant() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const chars = useMemo(() => {
    const radius = BARRIER_RADIUS + 28;
    const metresPerPx = (156_543.03 * Math.cos((CAMPUS_CENTER[0] * Math.PI) / 180)) / 2 ** zoom;
    const count = Math.min(360, Math.floor((2 * Math.PI * radius) / metresPerPx / 28));
    return Array.from({ length: count }, (_, i) => {
      const deg = (i / count) * 360;
      return { i, deg, pos: offset(CAMPUS_CENTER[0], CAMPUS_CENTER[1], radius, deg), ch: CHANT[i % CHANT.length] };
    });
  }, [zoom]);
  return chars.map((c) => (
    <Marker key={`${zoom}-${c.i}`} position={c.pos} icon={chantIcon(c.ch, c.deg)} interactive={false} keyboard={false} />
  ));
}

export default function VeilMap({
  locations,
  selectedId,
  onSelect,
  me,
}: {
  locations: LocationSummary[];
  selectedId?: string;
  onSelect: (id: string) => void;
  me: { lat: number; lng: number; accuracy: number } | null;
}) {
  const selected = locations.find((p) => p.id === selectedId);
  const cleared = useMemo(() => locations.filter((p) => p.cleared), [locations]);
  const barrier = useMemo(() => ring(CAMPUS_CENTER[0], CAMPUS_CENTER[1], BARRIER_RADIUS, 96), []);
  // Outside the barrier: dark. Inside: a thin veil, with holes where curses were exorcised.
  const outside = useMemo(() => [WORLD, barrier], [barrier]);
  const veil = useMemo(
    () => [barrier, ...cleared.map((p) => ring(p.lat, p.lng, CLEARED_RADIUS))],
    [barrier, cleared],
  );
  const icons = useMemo(
    () => Object.fromEntries(locations.map((p) => [p.id, ofuda(p, p.id === selectedId)])),
    [locations, selectedId],
  );
  // Cursed spirits haunt every place that still has curses: more for more missions.
  const spirits = useMemo(
    () =>
      locations
        .filter((p) => !p.cleared && p.questCount > 0)
        .flatMap((p) => {
          const rnd = seeded(p.id);
          const glow = GRADES[p.topGrade].glow;
          return Array.from({ length: Math.min(3, p.questCount) }, (_, i) => ({
            key: `${p.id}-${i}`,
            placeId: p.id,
            name: p.name,
            pos: offset(p.lat, p.lng, 45 + rnd() * 70, rnd() * 360),
            icon: spiritIcon(glow, -rnd() * 6, 5 + rnd() * 4, 22 + Math.round(rnd() * 10)),
          }));
        }),
    [locations],
  );

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={16}
      minZoom={15}
      maxZoom={19}
      maxBounds={[
        [CAMPUS_CENTER[0] - 0.03, CAMPUS_CENTER[1] - 0.035],
        [CAMPUS_CENTER[0] + 0.03, CAMPUS_CENTER[1] + 0.035],
      ]}
      maxBoundsViscosity={0.9}
      zoomControl={false}
      attributionControl
      className="veil-map absolute inset-0 z-0"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <Polygon positions={outside} interactive={false} pathOptions={{ stroke: false, fillColor: "#05030a", fillOpacity: 0.62 }} />
      <Polygon
        key={cleared.map((p) => p.id).join(",")}
        positions={veil}
        interactive={false}
        pathOptions={{ stroke: false, fillColor: "#1a0b33", fillOpacity: 0.16 }}
      />
      {/* Barrier edge: a wide soft glow under a flowing dashed line. */}
      <Polygon positions={barrier} interactive={false} pathOptions={{ color: "#8b4dff", weight: 18, opacity: 0.18, fill: false }} />
      <Polygon
        positions={barrier}
        interactive={false}
        pathOptions={{ color: "#bb98ff", weight: 2, opacity: 0.95, dashArray: "3 9", fill: false, className: "barrier-flow" }}
      />
      <Chant />

      {/* Exorcised places are roped off with a shimenawa and paper shide. */}
      {cleared.map((p) => (
        <Circle
          key={`rope-${p.id}`}
          center={[p.lat, p.lng]}
          radius={CLEARED_RADIUS}
          interactive={false}
          pathOptions={{ color: "#d9a94f", opacity: 0.9, weight: 3.5, fillColor: "#e9e0cb", fillOpacity: 0.06 }}
        />
      ))}
      {cleared.map((p) => (
        <Circle
          key={`shide-${p.id}`}
          center={[p.lat, p.lng]}
          radius={CLEARED_RADIUS}
          interactive={false}
          pathOptions={{ color: "#f4efe2", opacity: 0.95, weight: 9, dashArray: "2 26", lineCap: "butt", fill: false }}
        />
      ))}

      {selected && (
        <Marker
          key={`domain-${selected.id}`}
          position={[selected.lat, selected.lng]}
          icon={domainIcon(GRADES[selected.topGrade].glow)}
          interactive={false}
          keyboard={false}
          zIndexOffset={-1000}
        />
      )}

      {spirits.map((s) => (
        <Marker
          key={s.key}
          position={s.pos}
          icon={s.icon}
          title={`Cursed spirit near ${s.name}`}
          keyboard={false}
          eventHandlers={{ click: () => onSelect(s.placeId) }}
        />
      ))}

      {me && (
        <>
          <Circle
            center={[me.lat, me.lng]}
            radius={Math.min(me.accuracy, 150)}
            interactive={false}
            pathOptions={{ color: "#53a8ff", weight: 1, opacity: 0.5, fillColor: "#53a8ff", fillOpacity: 0.1 }}
          />
          <CircleMarker
            center={[me.lat, me.lng]}
            radius={7}
            interactive={false}
            pathOptions={{ color: "#e9e0cb", weight: 2, fillColor: "#53a8ff", fillOpacity: 1 }}
          />
        </>
      )}

      {locations.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icons[p.id]}
          title={p.name}
          alt={`${p.name}, ${p.cleared ? "veil lifted" : "veiled"}`}
          keyboard
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}

      <FlyTo lat={selected?.lat} lng={selected?.lng} />
    </MapContainer>
  );
}
