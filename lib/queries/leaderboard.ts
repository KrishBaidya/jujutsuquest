import "server-only";
import { createHash } from "node:crypto";
import { sql } from "@/lib/db";
import { SPECIAL_SEATS, type GradeKey } from "@/lib/grades";

export type LeaderboardPeriod = "week" | "term" | "all";

/** Window lengths for the period scores. `all` reads users.ce directly. */
const WEEK_DAYS = 7;
const TERM_DAYS = 120;

export type LeaderboardStudent = {
  id: string;
  name: string;
  initials: string;
  department: string;
  hostelId: string | null;
  hostel: string;
  /** Stored grade, with "special" applied to the top SPECIAL_SEATS Grade 1 students. */
  grade: GradeKey;
  /** Score for the requested period. */
  score: number;
  /** Lifetime CE. */
  ce: number;
  /** Ledger sum over the last 7 days, whatever the period. */
  weekGain: number;
  /** 1-based position on the campus board for the period. */
  pos: number;
  /** Places gained (+) or lost (-) against a week ago. null = joined this week. */
  move: number | null;
};

export type HostelStanding = {
  id: string;
  name: string;
  crest: string;
  color: string;
  pos: number;
  members: number;
  /** Sum of member CE. */
  ce: number;
  perMember: number;
  /** Sum of member ledger gains over the last 7 days. */
  weekGain: number;
  /** Best contributors this week. */
  top: { id: string; name: string; ce: number }[];
};

export type SpecialSeat = {
  seat: number;
  holder: {
    id: string;
    name: string;
    initials: string;
    department: string;
    hostel: string;
    ce: number;
  } | null;
};

export type LeaderboardSnapshot = {
  period: LeaderboardPeriod;
  /** Hash of everything that is ranked. Changes exactly when the board changes. */
  version: string;
  students: LeaderboardStudent[];
  hostels: HostelStanding[];
  special: {
    seats: SpecialSeat[];
    /** Best student outside the seats and the CE they need to take the lowest one. */
    challenger: { id: string; name: string; ce: number; gap: number } | null;
  };
};

type StudentRow = {
  id: string;
  name: string;
  department: string;
  hostel_id: string | null;
  ce: number;
  grade: string;
  is_new: boolean;
  wk: number;
  tm: number;
  wk_prev: number;
  tm_prev: number;
};

type HostelRow = { id: string; name: string; crest: string; color: string };

type Raw = { students: StudentRow[]; hostels: HostelRow[] };

async function load(): Promise<Raw> {
  const [students, hostels] = await Promise.all([
    sql`
      select u.id, u.name, u.department, u.hostel_id, u.ce, u.grade,
        (u.created_at > now() - make_interval(days => ${WEEK_DAYS})) as is_new,
        coalesce(sum(l.amount) filter (where l.created_at > now() - make_interval(days => ${WEEK_DAYS})), 0)::int as wk,
        coalesce(sum(l.amount) filter (where l.created_at > now() - make_interval(days => ${TERM_DAYS})), 0)::int as tm,
        coalesce(sum(l.amount) filter (
          where l.created_at <= now() - make_interval(days => ${WEEK_DAYS})
            and l.created_at > now() - make_interval(days => ${WEEK_DAYS * 2})), 0)::int as wk_prev,
        coalesce(sum(l.amount) filter (
          where l.created_at <= now() - make_interval(days => ${WEEK_DAYS})
            and l.created_at > now() - make_interval(days => ${TERM_DAYS + WEEK_DAYS})), 0)::int as tm_prev
      from users u
      left join ce_ledger l on l.user_id = u.id
      where u.role = 'student'
      group by u.id
    `,
    sql`select id, name, crest, color from hostels`,
  ]);
  return { students: students as StudentRow[], hostels: hostels as HostelRow[] };
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

type Scored = StudentRow & { score: number; prevScore: number };

/** Score desc, then lifetime CE, then name, so positions are stable between polls. */
const byScore = (key: "score" | "prevScore") => (a: Scored, b: Scored) =>
  b[key] - a[key] || b.ce - a.ce || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

function build(raw: Raw, period: LeaderboardPeriod): LeaderboardSnapshot {
  const hostelName = new Map(raw.hostels.map((h) => [h.id, h.name]));

  // Special Grade: the top SPECIAL_SEATS Grade 1 students by lifetime CE.
  const g1 = raw.students
    .filter((s) => s.grade === "g1")
    .sort((a, b) => b.ce - a.ce || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const holders = g1.slice(0, SPECIAL_SEATS);
  const holderIds = new Set(holders.map((h) => h.id));

  const scored: Scored[] = raw.students.map((s) => ({
    ...s,
    score: period === "week" ? s.wk : period === "term" ? s.tm : s.ce,
    prevScore: period === "week" ? s.wk_prev : period === "term" ? s.tm_prev : s.ce - s.wk,
  }));
  const prevPos = new Map(
    [...scored].sort(byScore("prevScore")).map((s, i) => [s.id, i + 1] as const),
  );

  const students: LeaderboardStudent[] = [...scored].sort(byScore("score")).map((s, i) => ({
    id: s.id,
    name: s.name,
    initials: initialsOf(s.name),
    department: s.department,
    hostelId: s.hostel_id,
    hostel: (s.hostel_id && hostelName.get(s.hostel_id)) || "Day scholar",
    grade: holderIds.has(s.id) ? "special" : (s.grade as GradeKey),
    score: s.score,
    ce: s.ce,
    weekGain: s.wk,
    pos: i + 1,
    move: s.is_new ? null : prevPos.get(s.id)! - (i + 1),
  }));

  const hostels: HostelStanding[] = raw.hostels
    .map((h) => {
      const members = raw.students.filter((s) => s.hostel_id === h.id);
      const ce = members.reduce((n, s) => n + s.ce, 0);
      return {
        id: h.id,
        name: h.name,
        crest: h.crest,
        color: h.color,
        pos: 0,
        members: members.length,
        ce,
        perMember: members.length ? Math.round(ce / members.length) : 0,
        weekGain: members.reduce((n, s) => n + s.wk, 0),
        top: members
          .filter((s) => s.wk > 0)
          .sort((a, b) => b.wk - a.wk || a.name.localeCompare(b.name))
          .slice(0, 3)
          .map((s) => ({ id: s.id, name: s.name, ce: s.wk })),
      };
    })
    .sort((a, b) => b.ce - a.ce || a.name.localeCompare(b.name))
    .map((h, i) => ({ ...h, pos: i + 1 }));

  const seats: SpecialSeat[] = Array.from({ length: SPECIAL_SEATS }, (_, i) => {
    const h = holders[i];
    return {
      seat: i + 1,
      holder: h
        ? {
            id: h.id,
            name: h.name,
            initials: initialsOf(h.name),
            department: h.department,
            hostel: (h.hostel_id && hostelName.get(h.hostel_id)) || "Day scholar",
            ce: h.ce,
          }
        : null,
    };
  });

  const next = [...raw.students]
    .filter((s) => !holderIds.has(s.id))
    .sort((a, b) => b.ce - a.ce || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))[0];
  const lowest = holders.length === SPECIAL_SEATS ? holders[SPECIAL_SEATS - 1] : undefined;
  const challenger = next
    ? {
        id: next.id,
        name: next.name,
        ce: next.ce,
        // Full board: pass the lowest holder. Open seat: reach Grade 1 (5,000 CE).
        gap: lowest ? Math.max(lowest.ce - next.ce + 1, 1) : Math.max(5000 - next.ce, 1),
      }
    : null;

  const version = createHash("sha1")
    .update(
      JSON.stringify([
        students.map((s) => [s.id, s.pos, s.score, s.ce, s.weekGain, s.grade, s.move]),
        hostels.map((h) => [h.id, h.pos, h.ce, h.weekGain]),
        seats.map((s) => s.holder?.id ?? null),
      ]),
    )
    .digest("hex")
    .slice(0, 16);

  return { period, version, students, hostels, special: { seats, challenger } };
}

/** One snapshot of the campus board for a period, from two queries. */
export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardSnapshot> {
  return build(await load(), period);
}

/** All three periods from the same two queries, for the server-rendered page. */
export async function getAllLeaderboards(): Promise<Record<LeaderboardPeriod, LeaderboardSnapshot>> {
  const raw = await load();
  return { week: build(raw, "week"), term: build(raw, "term"), all: build(raw, "all") };
}

export const isPeriod = (v: string | null): v is LeaderboardPeriod =>
  v === "week" || v === "term" || v === "all";
