"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, TileLayer, useMap } from "react-leaflet";
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

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function ofuda(place: LocationSummary, active: boolean) {
  const glow = GRADES[place.topGrade].glow;
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="ofuda-pin" style="--c:${glow}" data-cleared="${place.cleared}" data-active="${active}">
      <div class="strip"><b>${escapeHtml(place.kanji)}</b><i></i></div>
      <div class="stake"></div>
      <div class="ground"></div>
      <span class="label">${escapeHtml(place.name)}</span>
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
  // Outside the barrier: near-black. Inside: the veil, with holes where curses were exorcised.
  const outside = useMemo(() => [WORLD, barrier], [barrier]);
  const veil = useMemo(
    () => [barrier, ...cleared.map((p) => ring(p.lat, p.lng, CLEARED_RADIUS))],
    [barrier, cleared],
  );
  const icons = useMemo(
    () => Object.fromEntries(locations.map((p) => [p.id, ofuda(p, p.id === selectedId)])),
    [locations, selectedId],
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

      <Polygon positions={outside} interactive={false} pathOptions={{ stroke: false, fillColor: "#030305", fillOpacity: 0.82 }} />
      <Polygon
        key={cleared.map((p) => p.id).join(",")}
        positions={veil}
        interactive={false}
        pathOptions={{ stroke: false, fillColor: "#06030d", fillOpacity: 0.55 }}
      />
      {/* Barrier edge: a wide soft glow under a thin dashed line. */}
      <Polygon positions={barrier} interactive={false} pathOptions={{ color: "#8b4dff", weight: 14, opacity: 0.12, fill: false }} />
      <Polygon
        positions={barrier}
        interactive={false}
        pathOptions={{ color: "#bb98ff", weight: 1.5, opacity: 0.8, dashArray: "2 7", fill: false }}
      />

      {cleared.map((p) => (
        <Circle
          key={p.id}
          center={[p.lat, p.lng]}
          radius={CLEARED_RADIUS}
          interactive={false}
          pathOptions={{ color: "#e9e0cb", opacity: 0.55, weight: 1, dashArray: "3 5", fill: false }}
        />
      ))}

      {me && (
        <>
          <Circle
            center={[me.lat, me.lng]}
            radius={Math.min(me.accuracy, 150)}
            interactive={false}
            pathOptions={{ color: "#53a8ff", weight: 1, opacity: 0.4, fillColor: "#53a8ff", fillOpacity: 0.08 }}
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
