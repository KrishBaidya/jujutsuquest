import type { GradeKey } from "./grades";

/** Chandigarh University, Gharuan (centre and bounds from OpenStreetMap). */
export const CAMPUS_CENTER: [number, number] = [30.76864, 76.57505];
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [30.7612, 76.5652],
  [30.776, 76.5825],
];

export type CampusPlace = {
  id: string;
  name: string;
  kanji: string;
  lat: number;
  lng: number;
  grade: GradeKey;
  note: string;
  /** Quest currently posted at this place, if any. */
  questId?: string;
  image?: string;
  distance: string;
  /** Cleared places lift the veil around them. */
  cleared: boolean;
};

// Positions are approximate placements inside the campus boundary, not surveyed
// coordinates. Correct lat/lng here and the labels move with them.
export const campusPlaces: CampusPlace[] = [
  {
    id: "fountain-plaza",
    name: "Fountain plaza",
    kanji: "癒",
    lat: 30.76905,
    lng: 76.57565,
    grade: "g4",
    note: "The dry fountain. A curse gathers under the red sky.",
    questId: "fountain-walk",
    image: "/locations/fountain-plaza.jpg",
    distance: "90 m",
    cleared: true,
  },
  {
    id: "fire-station",
    name: "Fire station",
    kanji: "火",
    lat: 30.7662,
    lng: 76.5722,
    grade: "semi1",
    note: "The old engine still idles in the dark bay.",
    image: "/locations/fire-station.jpg",
    distance: "420 m",
    cleared: false,
  },
  {
    id: "night-cafe",
    name: "Night café",
    kanji: "縁",
    lat: 30.7679,
    lng: 76.5768,
    grade: "g3",
    note: "Empty stools and long shadows. Quiet, for now.",
    questId: "chess-tea",
    image: "/locations/night-cafe.jpg",
    distance: "260 m",
    cleared: true,
  },
  {
    id: "library",
    name: "Old library steps",
    kanji: "探",
    lat: 30.7702,
    lng: 76.5741,
    grade: "g3",
    note: "East steps. First light lands here before anywhere else.",
    questId: "sunrise-library",
    distance: "220 m",
    cleared: true,
  },
  {
    id: "block-c",
    name: "Block C courtyard",
    kanji: "探",
    lat: 30.7711,
    lng: 76.5772,
    grade: "g2",
    note: "A painted wall most students walk past.",
    questId: "hidden-mural",
    distance: "350 m",
    cleared: false,
  },
  {
    id: "student-centre",
    name: "Student centre",
    kanji: "祭",
    lat: 30.7675,
    lng: 76.5737,
    grade: "g3",
    note: "Notice boards and the club fair checkpoints.",
    questId: "club-fair",
    distance: "400 m",
    cleared: false,
  },
  {
    id: "auditorium",
    name: "Auditorium",
    kanji: "技",
    lat: 30.7723,
    lng: 76.5752,
    grade: "g1",
    note: "The alumni panel sits here on Mondays.",
    questId: "alumni-pitch",
    distance: "510 m",
    cleared: false,
  },
  {
    id: "zakir-hostel",
    name: "Zakir hostel",
    kanji: "龍",
    lat: 30.7651,
    lng: 76.5764,
    grade: "g4",
    note: "Your hostel. Home ground for this week's duel.",
    distance: "480 m",
    cleared: true,
  },
];

export const placeById = (id: string | undefined) => campusPlaces.find((p) => p.id === id);

/** Where the student is standing in the mock: inside the fountain curtain. */
export const YOU: [number, number] = [30.76893, 76.57585];
export const ACTIVE_PLACE = "fountain-plaza";

/** Ring of points `radius` metres around a position, for cutting holes in the veil. */
export function ring(lat: number, lng: number, radius: number, steps = 40): [number, number][] {
  const dLat = radius / 111_320;
  const dLng = radius / (111_320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [lat + dLat * Math.sin(a), lng + dLng * Math.cos(a)];
  });
}
