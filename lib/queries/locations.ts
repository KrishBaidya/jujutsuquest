import "server-only";
import { and, asc, eq, gt, isNull, or, sql as dsql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { DbGrade, MissionStatus, VerificationMethod } from "@/lib/db/schema";
import { GRADE_ORDER } from "@/lib/grades";

const { locations, quests, missions } = schema;

export type NextQuest = { id: string; title: string; ce: number; verification: VerificationMethod };

export type LocationSummary = {
  id: string;
  name: string;
  kanji: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  /** The user has at least one completed mission here. */
  cleared: boolean;
  /** Open, unexpired quests. */
  questCount: number;
  /** Highest grade among open quests, for pin colour. */
  topGrade: DbGrade;
  /** First open quest the user has not completed. */
  nextQuest: NextQuest | null;
};

export type LocationQuest = NextQuest & {
  grade: DbGrade;
  /** The user's mission status on this quest, or null if not accepted. */
  missionStatus: MissionStatus | null;
};

export type LocationDetail = LocationSummary & { quests: LocationQuest[] };

const rank = (g: DbGrade) => GRADE_ORDER.indexOf(g);

// Explicit columns everywhere: reference_description and qr_token_hash are server only.
const locationColumns = {
  id: locations.id,
  name: locations.name,
  kanji: locations.kanji,
  lat: locations.lat,
  lng: locations.lng,
  imageUrl: locations.imageUrl,
};

async function loadQuests(userId: string | null) {
  const open = await db
    .select({
      id: quests.id,
      locationId: quests.locationId,
      title: quests.title,
      grade: quests.grade,
      ce: quests.ce,
      verification: quests.verification,
      missionStatus: missions.status,
    })
    .from(quests)
    .leftJoin(
      missions,
      and(eq(missions.questId, quests.id), userId ? eq(missions.userId, userId) : dsql`false`),
    )
    .where(and(eq(quests.status, "open"), or(isNull(quests.expiresAt), gt(quests.expiresAt, dsql`now()`))))
    .orderBy(asc(quests.createdAt), asc(quests.id));

  // A location is cleared by any completed mission, even on a quest that has since closed.
  const cleared = new Set<string>();
  if (userId) {
    const rows = await db
      .selectDistinct({ locationId: quests.locationId })
      .from(missions)
      .innerJoin(quests, eq(quests.id, missions.questId))
      .where(and(eq(missions.userId, userId), eq(missions.status, "completed")));
    for (const r of rows) cleared.add(r.locationId);
  }
  return { open, cleared };
}

type Loaded = Awaited<ReturnType<typeof loadQuests>>;

function summarise(
  loc: { id: string; name: string; kanji: string; lat: number; lng: number; imageUrl: string | null },
  { open, cleared }: Loaded,
): LocationDetail {
  const list: LocationQuest[] = open
    .filter((q) => q.locationId === loc.id)
    .map((q) => ({
      id: q.id,
      title: q.title,
      ce: q.ce,
      verification: q.verification,
      grade: q.grade,
      missionStatus: q.missionStatus,
    }));
  const next = list.find((q) => q.missionStatus !== "completed");
  return {
    ...loc,
    cleared: cleared.has(loc.id),
    questCount: list.length,
    topGrade: list.reduce<DbGrade>((top, q) => (rank(q.grade) > rank(top) ? q.grade : top), "g4"),
    nextQuest: next ? { id: next.id, title: next.title, ce: next.ce, verification: next.verification } : null,
    quests: list,
  };
}

export async function getLocations(userId: string | null): Promise<LocationSummary[]> {
  const [locs, loaded] = await Promise.all([
    db.select(locationColumns).from(locations).orderBy(asc(locations.createdAt), asc(locations.id)),
    loadQuests(userId),
  ]);
  return locs.map((l) => {
    const { quests, ...summary } = summarise(l, loaded);
    void quests;
    return summary;
  });
}

export async function getLocation(id: string, userId: string | null): Promise<LocationDetail | null> {
  const [[loc], loaded] = await Promise.all([
    db.select(locationColumns).from(locations).where(eq(locations.id, id)).limit(1),
    loadQuests(userId),
  ]);
  return loc ? summarise(loc, loaded) : null;
}
