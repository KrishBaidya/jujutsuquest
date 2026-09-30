"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Polygon, TileLayer, useMap } from "react-leaflet";
import { GRADES } from "@/lib/grades";
import {
  ACTIVE_PLACE,
  CAMPUS_BOUNDS,
  CAMPUS_CENTER,
  YOU,
  campusPlaces,
  ring,
  type CampusPlace,
} from "@/lib/campus";

const CLEARED_RADIUS = 70; // metres of veil lifted around a cleared place
const GEOFENCE_RADIUS = 45;

// One big polygon covering the region with a hole punched at every cleared place.
const WORLD: [number, number][] = [
  [30.72, 76.52],
  [30.72, 76.63],
  [30.82, 76.63],
  [30.82, 76.52],
];
const VEIL = [
  WORLD,
  ...campusPlaces.filter((p) => p.cleared).map((p) => ring(p.lat, p.lng, CLEARED_RADIUS)),
];

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function pinIcon(place: CampusPlace, active: boolean) {
  const color = GRADES[place.grade].color;
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="cmb-pin" style="--c:${color}" data-veiled="${!place.cleared}" data-active="${active}">
      <span class="cmb-pin-dot">${escapeHtml(place.kanji)}</span>
      <span class="cmb-pin-label">${escapeHtml(place.name)}</span>
    </div>`,
  });
}

const youIcon = L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="cmb-you"></div>` });

/** Pans to the selected place, and to the student when `locateTick` changes. */
function Camera({ selected, locateTick }: { selected?: CampusPlace; locateTick: number }) {
  const map = useMap();

  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 17), { duration: 0.6 });
  }, [map, selected]);

  useEffect(() => {
    if (locateTick > 0) map.flyTo(YOU, 18, { duration: 0.6 });
  }, [map, locateTick]);

  return null;
}

export default function CampusMap({
  selectedId,
  onSelect,
  locateTick,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
  locateTick: number;
}) {
  const selected = campusPlaces.find((p) => p.id === selectedId);
  const active = campusPlaces.find((p) => p.id === ACTIVE_PLACE)!;

  const icons = useMemo(
    () => Object.fromEntries(campusPlaces.map((p) => [p.id, pinIcon(p, p.id === selectedId)])),
    [selectedId],
  );

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={16}
      minZoom={15}
      maxZoom={19}
      maxBounds={CAMPUS_BOUNDS}
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
        positions={VEIL}
        interactive={false}
        pathOptions={{ stroke: false, fillColor: "#0B0C0F", fillOpacity: 0.62 }}
      />
      {campusPlaces
        .filter((p) => p.cleared)
        .map((p) => (
          <Circle
            key={p.id}
            center={[p.lat, p.lng]}
            radius={CLEARED_RADIUS}
            interactive={false}
            pathOptions={{ color: "#EFE9DC", opacity: 0.4, weight: 1, dashArray: "4 5", fill: false }}
          />
        ))}

      {/* geofence of the mission the student is standing in */}
      <Circle
        center={[active.lat, active.lng]}
        radius={GEOFENCE_RADIUS}
        interactive={false}
        pathOptions={{
          className: "cmb-geofence",
          color: "#3D8BFF",
          weight: 2,
          fillColor: "#3D8BFF",
          fillOpacity: 0.18,
        }}
      />

      {campusPlaces.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icons[p.id]}
          title={p.name}
          alt={`${p.name}, ${GRADES[p.grade].label}`}
          keyboard
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}
      <Marker position={YOU} icon={youIcon} interactive={false} zIndexOffset={500} />

      <Camera selected={selected} locateTick={locateTick} />
    </MapContainer>
  );
}
