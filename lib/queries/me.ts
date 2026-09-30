import "server-only";
import { and, asc, desc, eq, gt, inArray, sql as dsql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  badges,
  ceLedger,
  hostels,
  locations,
  missions,
  quests,
  submissions,
  userBadges,
  users,
  type User,
} from "@/lib/db/schema";
import { SPECIAL_SEATS } from "@/lib/grades";
import { photoUrl } from "@/lib/storage";

export async function getProfile(user: User) {
  const [hostel] = user.hostelId
    ? await db.select().from(hostels).where(eq(hostels.id, user.hostelId)).limit(1)
    : [];

  const [ahead] = await db
    .select({ n: dsql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, "student"), gt(users.ce, user.ce)));

  let special = false;
  // Same rule as the leaderboard: top seats among Grade 1 students, CE then name then id.
  if (user.grade === "g1" && user.role === "student") {
    const seats = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.grade, "g1"), eq(users.role, "student")))
      .orderBy(desc(users.ce), asc(users.name), asc(users.id))
      .limit(SPECIAL_SEATS);
    special = seats.some((s) => s.id === user.id);
  }

  const allBadges = await db
    .select({
      id: badges.id,
      name: badges.name,
      kanji: badges.kanji,
      description: badges.description,
      earnedAt: userBadges.earnedAt,
    })
    .from(badges)
    .leftJoin(userBadges, and(eq(userBadges.badgeId, badges.id), eq(userBadges.userId, user.id)))
    .orderBy(asc(badges.sort));

  const history = await db
    .select({
      id: ceLedger.id,
      amount: ceLedger.amount,
      reason: ceLedger.reason,
      note: ceLedger.note,
      createdAt: ceLedger.createdAt,
      questTitle: quests.title,
    })
    .from(ceLedger)
    .leftJoin(quests, eq(quests.id, ceLedger.questId))
    .where(eq(ceLedger.userId, user.id))
    .orderBy(desc(ceLedger.createdAt), desc(ceLedger.id))
    .limit(12);

  let reviewCount = 0;
  if (user.role === "reviewer") {
    const [r] = await db
      .select({ n: dsql<number>`count(*)::int` })
      .from(submissions)
      .where(eq(submissions.status, "in_review"));
    reviewCount = r?.n ?? 0;
  }

  return {
    hostel: hostel ?? null,
    rank: (ahead?.n ?? 0) + 1,
    special,
    badges: allBadges,
    history,
    reviewCount,
  };
}

export async function getMissions(userId: string) {
  const rows = await db
    .select({
      id: missions.id,
      status: missions.status,
      acceptedAt: missions.acceptedAt,
      completedAt: missions.completedAt,
      questId: quests.id,
      title: quests.title,
      category: quests.category,
      grade: quests.grade,
      ce: quests.ce,
      verification: quests.verification,
      expiresAt: quests.expiresAt,
      locationName: locations.name,
    })
    .from(missions)
    .innerJoin(quests, eq(quests.id, missions.questId))
    .innerJoin(locations, eq(locations.id, quests.locationId))
    .where(eq(missions.userId, userId))
    .orderBy(desc(missions.acceptedAt));

  const questIds = rows.map((r) => r.questId);

  // CE actually paid per quest, Black Flash bonus included.
  const paid = new Map<string, number>();
  const reasons = new Map<string, string>();
  if (questIds.length) {
    const sums = await db
      .select({ questId: ceLedger.questId, total: dsql<number>`sum(${ceLedger.amount})::int` })
      .from(ceLedger)
      .where(
        and(
          eq(ceLedger.userId, userId),
          inArray(ceLedger.questId, questIds),
          inArray(ceLedger.reason, ["quest", "black_flash"]),
        ),
      )
      .groupBy(ceLedger.questId);
    for (const s of sums) if (s.questId) paid.set(s.questId, s.total);

    const subs = await db
      .select({ questId: submissions.questId, reason: submissions.reason, status: submissions.status })
      .from(submissions)
      .where(and(eq(submissions.userId, userId), inArray(submissions.questId, questIds)))
      .orderBy(desc(submissions.createdAt));
    // Only the latest submission counts, so a later retry hides an old rejection.
    const seen = new Set<string>();
    for (const s of subs) {
      if (seen.has(s.questId)) continue;
      seen.add(s.questId);
      if (s.status === "rejected" && s.reason) reasons.set(s.questId, s.reason);
    }
  }

  const withExtra = rows.map((r) => ({
    ...r,
    earned: paid.get(r.questId) ?? 0,
    rejectReason: reasons.get(r.questId) ?? null,
  }));
  return {
    accepted: withExtra.filter((m) => m.status === "accepted"),
    inReview: withExtra.filter((m) => m.status === "in_review"),
    completed: withExtra.filter((m) => m.status === "completed"),
    rejected: withExtra.filter((m) => m.status === "rejected"),
  };
}

export async function getReviewQueue() {
  const rows = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      photoKey: submissions.photoKey,
      confidence: submissions.confidence,
      reason: submissions.reason,
      createdAt: submissions.createdAt,
      questTitle: quests.title,
      questCe: quests.ce,
      locationName: locations.name,
      studentName: users.name,
      studentUid: users.uid,
    })
    .from(submissions)
    .innerJoin(quests, eq(quests.id, submissions.questId))
    .innerJoin(locations, eq(locations.id, quests.locationId))
    .innerJoin(users, eq(users.id, submissions.userId))
    .where(eq(submissions.status, "in_review"))
    .orderBy(asc(submissions.createdAt));

  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      ageMinutes: Math.max(0, Math.round((Date.now() - r.createdAt.getTime()) / 60000)),
      photo: r.photoKey ? await photoUrl(r.photoKey).catch(() => null) : null,
    })),
  );
}
