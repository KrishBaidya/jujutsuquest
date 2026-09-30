"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Polygon, TileLayer, useMap } from "react-leaflet";
import { GRADES } from "@/lib/grades";
import { CAMPUS_CENTER, boundsAround, ring } from "@/lib/campus";
import type { LocationSummary } from "@/lib/queries/locations";

const CLEARED_RADIUS = 70; // metres of veil lifted around a cleared place

// One big polygon covering the region with a hole punched at every cleared place.
const WORLD: [number, number][] = [
  [30.72, 76.52],
  [30.72, 76.63],
  [30.82, 76.63],
  [30.82, 76.52],
];

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function pinIcon(place: LocationSummary, active: boolean) {
  const color = GRADES[place.topGrade].color;
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="cmb-pin" style="--c:${color}" data-veiled="${!place.cleared}" data-active="${active}">
      <span class="cmb-pin-dot">${escapeHtml(place.kanji)}</span>
      <span class="cmb-pin-label">${escapeHtml(place.name)}</span>
    </div>`,
  });
}

/** Pans to the selected place. */
function Camera({ selected }: { selected?: LocationSummary }) {
  const map = useMap();
  const lat = selected?.lat;
  const lng = selected?.lng;

  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 17), { duration: 0.6 });
    }
  }, [map, lat, lng]);

  return null;
}

export default function CampusMap({
  locations,
  selectedId,
  onSelect,
}: {
  locations: LocationSummary[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const selected = locations.find((p) => p.id === selectedId);
  const cleared = useMemo(() => locations.filter((p) => p.cleared), [locations]);
  const bounds = useMemo(() => boundsAround(locations), [locations]);
  const veil = useMemo(
    () => [WORLD, ...cleared.map((p) => ring(p.lat, p.lng, CLEARED_RADIUS))],
    [cleared],
  );

  const icons = useMemo(
    () => Object.fromEntries(locations.map((p) => [p.id, pinIcon(p, p.id === selectedId)])),
    [locations, selectedId],
  );

  return (
    <MapContainer
      center={selected ? [selected.lat, selected.lng] : CAMPUS_CENTER}
      zoom={16}
      minZoom={15}
      maxZoom={19}
      maxBounds={bounds}
      maxBoundsViscosity={0.8}
      zoomControl={false}
      className="campus-map absolute inset-0 z-0"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {/* the veil */}
      <Polygon
        key={cleared.map((p) => p.id).join(",")}
        positions={veil}
        interactive={false}
        pathOptions={{ stroke: false, fillColor: "#0B0C0F", fillOpacity: 0.62 }}
      />
      {cleared.map((p) => (
        <Circle
          key={p.id}
          center={[p.lat, p.lng]}
          radius={CLEARED_RADIUS}
          interactive={false}
          pathOptions={{ color: "#EFE9DC", opacity: 0.4, weight: 1, dashArray: "4 5", fill: false }}
        />
      ))}

      {locations.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icons[p.id]}
          title={p.name}
          alt={`${p.name}, ${p.cleared ? "cleared" : "veiled"}`}
          keyboard
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}

      <Camera selected={selected} />
    </MapContainer>
  );
}
