import type { GradeKey } from "./grades";

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

export type Period = "week" | "term" | "all";

export type Leader = {
  id: string;
  name: string;
  initials: string;
  dept: string;
  hostel: string;
  grade: GradeKey;
  /** CE by period. */
  ce: Record<Period, number>;
  /** Places moved since last week; positive is up. `null` means new entry. */
  move: number | null;
  /** Consecutive days with a completed mission. */
  streak: number;
  isMe?: boolean;
};

// name, dept, hostel, grade, term CE, move, streak
type Row = [string, string, string, GradeKey, number, number | null, number];

const topRows: Row[] = [
  ["Diya Kapoor", "Finance", "Sukhna", "special", 9840, 0, 41],
  ["Rohan Iyer", "Analytics", "Zakir", "special", 8215, 1, 27],
  ["Meher Sandhu", "HR", "Tagore", "semi1", 6930, -1, 19],
  ["Kabir Das", "Marketing", "Zakir", "semi1", 6410, 2, 12],
  ["Ananya Rao", "Operations", "Shivalik", "semi1", 5870, 0, 33],
  ["Ishaan Verma", "Finance", "Nek Chand", "g2", 4990, -2, 8],
  ["Sara Thomas", "Insurance", "Sukhna", "g2", 4620, 3, 15],
  ["Vikram Joshi", "Analytics", "Govind", "g2", 4305, 0, 6],
  ["Tara Menon", "Marketing", "Tagore", "g2", 4120, 1, 22],
  ["Arjun Bose", "HR", "Zakir", "g2", 3980, -1, 4],
  ["Nisha Pillai", "Finance", "Shivalik", "g2", 3865, 4, 17],
  ["Dev Malhotra", "Operations", "Nek Chand", "g2", 3710, null, 3],
  ["Zoya Khan", "Marketing", "Sukhna", "g2", 3590, -3, 9],
  ["Aditya Rao", "Analytics", "Govind", "g2", 3475, 0, 11],
  ["Isha Reddy", "Insurance", "Tagore", "g2", 3320, 2, 5],
  ["Neel Shah", "Finance", "Zakir", "g3", 3190, -1, 2],
  ["Maya Pillai", "HR", "Shivalik", "g3", 3045, 1, 14],
  ["Kabir Nair", "Operations", "Nek Chand", "g3", 2930, 0, 7],
  ["Riya Sen", "Marketing", "Sukhna", "g3", 2815, 5, 20],
  ["Yash Gupta", "Analytics", "Govind", "g3", 2700, -2, 1],
];

// The window of ranks around the signed-in student (#45 to #49).
const nearRows: Row[] = [
  ["Pooja Bhatt", "Finance", "Tagore", "g3", 1560, -1, 3],
  ["Karan Mehra", "HR", "Sukhna", "g3", 1540, 2, 6],
  ["Aarav Mehta", "Marketing", "Zakir", "g3", 1480, 4, 9],
  ["Simran Kaur", "Operations", "Shivalik", "g3", 1455, -2, 2],
  ["Rahul Jain", "Analytics", "Govind", "g3", 1410, 0, 5],
];

/** Campus rank of the first row in the near-me window. */
export const NEAR_START = 45;
export const TOP_COUNT = topRows.length;

const toLeader = ([name, dept, hostel, grade, term, move, streak]: Row, i: number): Leader => ({
  id: name.toLowerCase().replace(/ /g, "-"),
  name,
  initials: name
    .split(" ")
    .map((w) => w[0])
    .join(""),
  dept,
  hostel,
  grade,
  // Weekly and all-time figures are derived so the three periods rank differently.
  ce: {
    term,
    week: Math.round(term * (0.05 + ((i * 37) % 11) / 100)),
    all: Math.round(term * (1.9 + ((i * 53) % 9) / 10)),
  },
  move,
  streak,
  isMe: name === "Aarav Mehta",
});

export const leaders: Leader[] = [
  ...topRows.map(toLeader),
  ...nearRows.map((r, i) => toLeader(r, topRows.length + i)),
];

export const departments = ["Finance", "Analytics", "Marketing", "Operations", "HR", "Insurance"];

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

// ---------- hostels ----------

export type Hostel = {
  id: string;
  name: string;
  crest: string;
  color: string;
  members: number;
  ce: number;
  wins: number;
  losses: number;
  /** Positive = winning streak, negative = losing streak. */
  streak: number;
};

// Placeholder hostel names and figures; replace with the real roster.
export const hostels: Hostel[] = [
  { id: "sukhna", name: "Sukhna", crest: "鳳", color: "#E5322D", members: 212, ce: 96420, wins: 5, losses: 0, streak: 5 },
  { id: "zakir", name: "Zakir", crest: "龍", color: "#3D8BFF", members: 198, ce: 91870, wins: 4, losses: 1, streak: 3 },
  { id: "tagore", name: "Tagore", crest: "虎", color: "#E0B04A", members: 205, ce: 84310, wins: 3, losses: 2, streak: 1 },
  { id: "shivalik", name: "Shivalik", crest: "狼", color: "#5FD0E6", members: 187, ce: 79640, wins: 3, losses: 2, streak: -1 },
  { id: "nek-chand", name: "Nek Chand", crest: "鷹", color: "#3FB68B", members: 176, ce: 66280, wins: 2, losses: 3, streak: 2 },
  { id: "govind", name: "Govind", crest: "熊", color: "#E0508A", members: 190, ce: 61950, wins: 2, losses: 3, streak: -2 },
  { id: "le-corbusier", name: "Le Corbusier", crest: "鹿", color: "#F0813A", members: 164, ce: 48720, wins: 1, losses: 4, streak: -3 },
  { id: "aravali", name: "Aravali", crest: "蛇", color: "#8FA3B8", members: 158, ce: 41090, wins: 0, losses: 5, streak: -5 },
];

export const hostelById = (id: string) => hostels.find((h) => h.id === id)!;

export const hostelDuel = {
  week: 6,
  endsIn: "2d 6h",
  home: {
    id: "zakir",
    ce: 12840,
    top: [
      { name: "Rohan Iyer", ce: 1120, isMe: false },
      { name: "Kabir Das", ce: 940, isMe: false },
      { name: "Aarav Mehta", ce: 410, isMe: true },
    ],
  },
  away: {
    id: "sukhna",
    ce: 11910,
    top: [
      { name: "Diya Kapoor", ce: 1305, isMe: false },
      { name: "Sara Thomas", ce: 760, isMe: false },
      { name: "Riya Sen", ce: 655, isMe: false },
    ],
  },
  stake: "+150 CE to every member of the winning hostel",
};

export type Fixture = {
  week: number;
  home: string;
  away: string;
  homeCe?: number;
  awayCe?: number;
  live: boolean;
};

export const hostelFixtures: Fixture[] = [
  { week: 6, home: "tagore", away: "shivalik", homeCe: 10220, awayCe: 10980, live: true },
  { week: 6, home: "nek-chand", away: "govind", homeCe: 8410, awayCe: 7930, live: true },
  { week: 6, home: "le-corbusier", away: "aravali", homeCe: 6120, awayCe: 5540, live: true },
  { week: 7, home: "zakir", away: "tagore", live: false },
  { week: 7, home: "sukhna", away: "shivalik", live: false },
  { week: 8, home: "zakir", away: "nek-chand", live: false },
];

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
  hostel: "zakir",
  streak: 9,
  weekCe: 410,
  weekMove: 4,
  reviewQueue: 6,
};

export const badges = [
  { k: "探", label: "First scout", locked: false },
  { k: "癒", label: "10 km walked", locked: false },
  { k: "縁", label: "Squad of 5", locked: false },
  { k: "夜", label: "Night owl", locked: true },
  { k: "審", label: "Fair judge", locked: true },
  { k: "祭", label: "Festival run", locked: true },
  { k: "技", label: "Sharp pitch", locked: true },
  { k: "閃", label: "Black Flash", locked: true },
  { k: "特", label: "Seat holder", locked: true },
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
export const missionsDone = [
  { title: "Tea with the chess club", ce: "+80 CE", when: "Mon" },
  { title: "Find the hidden mural", ce: "+120 CE", when: "Last Fri" },
  { title: "Wellness walk, fountain", ce: "+40 CE", when: "Last Thu" },
  { title: "Library orientation quiz", ce: "+60 CE", when: "Last Tue" },
];

export const schools = ["Finance", "Analytics", "Marketing", "Operations", "HR", "Insurance"];
