/** Chandigarh University, Gharuan (centre from OpenStreetMap). */
export const CAMPUS_CENTER: [number, number] = [30.76864, 76.57505];
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [30.7612, 76.5652],
  [30.776, 76.5825],
];

/** Bounds containing every point, padded by `pad` degrees. Falls back to the campus bounds. */
export function boundsAround(
  points: { lat: number; lng: number }[],
  pad = 0.004,
): [[number, number], [number, number]] {
  if (points.length === 0) return CAMPUS_BOUNDS;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return [
    [Math.min(...lats) - pad, Math.min(...lngs) - pad],
    [Math.max(...lats) + pad, Math.max(...lngs) + pad],
  ];
}

/** Ring of points `radius` metres around a position, for cutting holes in the veil. */
export function ring(lat: number, lng: number, radius: number, steps = 40): [number, number][] {
  const dLat = radius / 111_320;
  const dLng = radius / (111_320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [lat + dLat * Math.sin(a), lng + dLng * Math.cos(a)];
  });
}
