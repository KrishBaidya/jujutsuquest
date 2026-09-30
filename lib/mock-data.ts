import type { GradeKey } from "./grades";
import { GRADES } from "./grades";

export type CategoryKey = "explore" | "wellness" | "social" | "skill" | "event";

export const CATEGORIES: { key: CategoryKey; k: string; label: string }[] = [
  { key: "explore", k: "探", label: "Explore" },
  { key: "wellness", k: "癒", label: "Wellness" },
  { key: "social", k: "縁", label: "Social" },
  { key: "skill", k: "技", label: "Skill" },
  { key: "event", k: "祭", label: "Event" },
];

export const categoryOf = (key: CategoryKey) => CATEGORIES.find((c) => c.key === key)!;

export type Verification = "photo" | "qr" | "walk";

export type Quest = {
  id: string;
  grade: GradeKey;
  category: CategoryKey;
  title: string;
  description: string;
  location: string;
  distance: string;
  ce: number;
  verification: Verification;
  verifyHint: string;
  until: string;
  squad?: string;
  bounty?: { left: string };
  sealedUntil?: GradeKey;
};

export const quests: Quest[] = [
  {
    id: "sunrise-library",
    grade: "g3",
    category: "explore",
    title: "Sunrise at the old library steps",
    description:
      "Catch first light on the east steps before 7 am. One live photo with the sky in frame.",
    location: "Library quad",
    distance: "220 m",
    ce: 200,
    verification: "photo",
    verifyHint: "Take a live photo of the sky over the steps",
    until: "Today, 7 am",
    bounty: { left: "2h 14m left" },
  },
  {
    id: "hidden-mural",
    grade: "g2",
    category: "explore",
    title: "Find the hidden mural behind Block C",
    description:
      "Behind Block C there's a painted wall most students walk past. Somewhere in it is a small red fox. Find it and photograph it.",
    location: "Block C courtyard",
    distance: "350 m",
    ce: 120,
    verification: "photo",
    verifyHint: "Take a live photo of the red fox",
    until: "Fri, 6 pm",
    squad: "You're Grade 3. Bring a Grade 2 or higher.",
  },
  {
    id: "fountain-walk",
    grade: "g4",
    category: "wellness",
    title: "Wellness walk around the fountain",
    description: "Walk 600 m around the fountain plaza. Your phone tracks the distance.",
    location: "Fountain",
    distance: "90 m",
    ce: 40,
    verification: "walk",
    verifyHint: "Walk 600 m with tracking on",
    until: "Sun, midnight",
  },
  {
    id: "club-fair",
    grade: "g3",
    category: "event",
    title: "Club fair checkpoint run",
    description:
      "Scan the three QR codes on the notice boards, in any order, before the fair closes.",
    location: "Student centre",
    distance: "400 m",
    ce: 90,
    verification: "qr",
    verifyHint: "Scan the QR on each notice board",
    until: "Today, 5 pm",
  },
  {
    id: "chess-tea",
    grade: "g3",
    category: "social",
    title: "Tea with the chess club",
    description: "Sit down with the chess club for one round and a cup of tea.",
    location: "Common room",
    distance: "260 m",
    ce: 80,
    verification: "photo",
    verifyHint: "Take a live photo with a club member",
    until: "Wed, 8 pm",
  },
  {
    id: "alumni-pitch",
    grade: "g1",
    category: "skill",
    title: "Pitch a case to the alumni panel",
    description: "Three minutes, one slide, real feedback from the alumni panel.",
    location: "Auditorium",
    distance: "510 m",
    ce: 400,
    verification: "qr",
    verifyHint: "Scan the panel's QR after your pitch",
    until: "Next Mon, 4 pm",
  },
  {
    id: "sealed-1",
    grade: "semi1",
    category: "skill",
    title: "???",
    description: "",
    location: "",
    distance: "",
    ce: 0,
    verification: "photo",
    verifyHint: "",
    until: "",
    sealedUntil: "semi1",
  },
];

export const questById = (id: string) => quests.find((q) => q.id === id);

// ---------- rank ----------

type LeaderGrade = "special" | "semi1" | "g2";

const leaderRows: [string, string, LeaderGrade, string][] = [
  ["Diya Kapoor", "Finance", "special", "9,840"],
  ["Rohan Iyer", "Analytics", "special", "8,215"],
  ["Meher Sandhu", "HR", "semi1", "6,930"],
  ["Kabir Das", "Marketing", "semi1", "6,410"],
  ["Ananya Rao", "Operations", "semi1", "5,870"],
  ["Ishaan Verma", "Finance", "g2", "4,990"],
  ["Sara Thomas", "Insurance", "g2", "4,620"],
  ["Vikram Joshi", "Analytics", "g2", "4,305"],
  ["Tara Menon", "Marketing", "g2", "4,120"],
  ["Arjun Bose", "HR", "g2", "3,980"],
];

export const leaders = leaderRows.map(([name, dept, g, ce], i) => ({
  pos: i + 1,
  name,
  dept,
  grade: GRADES[g].label,
  color: GRADES[g].color,
  ce,
  initials: name
    .split(" ")
    .map((w) => w[0])
    .join(""),
}));

export const specialSeats = [
  { seat: 1, name: "Diya Kapoor", dept: "Finance", ce: "9,840" },
  { seat: 2, name: "Rohan Iyer", dept: "Analytics", ce: "8,215" },
  { seat: 3, name: null, dept: null, ce: null },
  { seat: 4, name: null, dept: null, ce: null },
];

const deptRows: [string, number][] = [
  ["Finance", 412],
  ["Analytics", 388],
  ["Marketing", 351],
  ["Operations", 297],
  ["HR", 244],
];
export const exchangeDepts = deptRows.map(([name, ce], i) => ({
  pos: i + 1,
  name,
  ce,
  pct: Math.round((ce / deptRows[0][1]) * 100),
  lead: i === 0,
}));

// ---------- profile ----------

export const me = {
  name: "Aarav Mehta",
  initials: "AM",
  dept: "Marketing",
  studentId: "BIM-2026-0417",
  grade: "g3" as GradeKey,
  ce: 1480,
  ceTarget: 1500,
  nextTrial: "Grade 2 trial",
  endorsements: 14,
  campusPos: 47,
  campusSize: "1,284",
  reviewQueue: 6,
};

export const badges = [
  { k: "探", label: "First scout", locked: false },
  { k: "癒", label: "10 km walked", locked: false },
  { k: "縁", label: "Squad of 5", locked: false },
  { k: "", label: "Night owl", locked: true },
];

export const fragments = Array.from({ length: 20 }, (_, i) => ({
  found: [0, 3, 7, 12].includes(i),
}));

export const ceHistory = [
  { k: "探", t: "Find the hidden mural", d: "Today · Explore", ce: "+120" },
  { k: "癒", t: "Wellness walk, fountain", d: "Yesterday · Wellness", ce: "+40" },
  { k: "縁", t: "Tea with the chess club", d: "Mon · Social", ce: "+80" },
  { k: "審", t: "Fair reviews ×3", d: "Sun · Review", ce: "+30" },
];

// ---------- review ----------

export const rejectReasons = ["Wrong place", "Wrong time of day", "Not a live photo", "Other"];

export const reviewQueue = [
  { title: "Sunrise at the old library steps", by: "Kabir Nair", grade: "Grade 4", ago: "12 min ago", cap: "Live photo, 6:12 am", ref: "Scouting shot", conf: 64, note: "Steps match. Sky is brighter than sunrise." },
  { title: "Wellness walk around the fountain", by: "Isha Reddy", grade: "Grade 4", ago: "31 min ago", cap: "Walk log, 612 m", ref: "Route map", conf: 91, note: "Route matches. Pace is steady." },
  { title: "Find the hidden mural", by: "Neel Shah", grade: "Grade 3", ago: "48 min ago", cap: "Live photo, 4:40 pm", ref: "Scouting shot", conf: 78, note: "Wall matches. Fox partly hidden." },
  { title: "Tea with the chess club", by: "Maya Pillai", grade: "Grade 4", ago: "1 h ago", cap: "Live photo, 3:05 pm", ref: "Club room", conf: 88, note: "Room and board match." },
  { title: "Club fair checkpoint run", by: "Zoya Khan", grade: "Grade 3", ago: "2 h ago", cap: "3 of 3 scans", ref: "Checkpoint list", conf: 97, note: "All codes valid, in order." },
  { title: "Feed the koi at the east pond", by: "Dev Malhotra", grade: "Grade 4", ago: "3 h ago", cap: "Live photo, 5:50 pm", ref: "Pond photo", conf: 72, note: "Pond matches. Koi not visible." },
];

// ---------- missions ----------

export const missionsActive = [
  { kind: "walk" as const, id: "fountain-walk", cat: "wellness" as CategoryKey, grade: "g4" as GradeKey, title: "Wellness walk around the fountain", done: 412, total: 600 },
  { kind: "checkpoints" as const, id: "club-fair", cat: "event" as CategoryKey, grade: "g3" as GradeKey, title: "Club fair checkpoint run", done: 2, total: 3, next: "Student centre", left: "38m left" },
];
export const missionsPending = [
  { title: "Find the hidden mural", note: "With a senior sorcerer · usually under 2 h" },
];
export const missionsDone = [{ title: "Tea with the chess club", ce: "+80 CE" }];

// ---------- map ----------

export const veilPins = [
  { grade: "g2" as GradeKey, x: 63, y: 36 },
  { grade: "g3" as GradeKey, x: 11, y: 44 },
  { grade: "g1" as GradeKey, x: 77, y: 27 },
];

export const locations = [
  { slug: "fountain-plaza", name: "Fountain plaza", image: "/locations/fountain-plaza.jpg", note: "The dry fountain. A curse gathers under the red sky.", grade: "g2" as GradeKey, distance: "180 m" },
  { slug: "fire-station", name: "Fire station", image: "/locations/fire-station.jpg", note: "The old engine still idles in the dark bay.", grade: "semi1" as GradeKey, distance: "420 m" },
  { slug: "night-cafe", name: "Night café", image: "/locations/night-cafe.jpg", note: "Empty stools and long shadows. Quiet, for now.", grade: "g4" as GradeKey, distance: "90 m" },
];

export const schools = ["Finance", "Analytics", "Marketing", "Operations", "HR", "Insurance"];
