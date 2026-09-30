import "server-only";
import { and, asc, desc, eq, gt, isNull, or, sql as dsql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  locations,
  missions,
  quests,
  type DbGrade,
  type MissionStatus,
  type QuestCategory,
  type VerificationMethod,
} from "@/lib/db/schema";

/** Plain, serialisable quest row for the board and detail pages. Never carries server-only location fields. */
export type QuestView = {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  grade: DbGrade;
  ce: number;
  verification: VerificationMethod;
  verifyHint: string;
  isBounty: boolean;
  /** ISO string, or null when the quest never expires. */
  expiresAt: string | null;
  locationId: string;
  locationName: string;
  locationImage: string | null;
  /** The current user's mission on this quest, if they accepted it. */
  missionStatus: MissionStatus | null;
};

export type SiteView = { id: string; name: string; image: string | null; questCount: number };

const notExpired = () => or(isNull(quests.expiresAt), gt(quests.expiresAt, dsql`now()`));

const questColumns = {
  id: quests.id,
  title: quests.title,
  description: quests.description,
  category: quests.category,
  grade: quests.grade,
  ce: quests.ce,
  verification: quests.verification,
  verifyHint: quests.verifyHint,
  isBounty: quests.isBounty,
  expiresAt: quests.expiresAt,
  locationId: quests.locationId,
  locationName: locations.name,
  locationImage: locations.imageUrl,
  missionStatus: missions.status,
};

type Row = Omit<QuestView, "expiresAt"> & { expiresAt: Date | null };

const toView = ({ expiresAt, ...r }: Row): QuestView => ({
  ...r,
  expiresAt: expiresAt ? expiresAt.toISOString() : null,
});

/** Open, unexpired quests with the user's mission status, newest first. */
export async function listOpenQuests(userId: string): Promise<QuestView[]> {
  const rows = await db
    .select(questColumns)
    .from(quests)
    .innerJoin(locations, eq(locations.id, quests.locationId))
    .leftJoin(missions, and(eq(missions.questId, quests.id), eq(missions.userId, userId)))
    .where(and(eq(quests.status, "open"), notExpired()))
    .orderBy(desc(quests.createdAt), asc(quests.id));
  return rows.map(toView);
}

/**
 * One quest by id. Open quests are visible to everyone; a quest that has
 * closed or is pending stays visible only to a student who already has a mission on it.
 */
export async function getQuest(id: string, userId: string): Promise<QuestView | null> {
  const [row] = await db
    .select({ ...questColumns, status: quests.status })
    .from(quests)
    .innerJoin(locations, eq(locations.id, quests.locationId))
    .leftJoin(missions, and(eq(missions.questId, quests.id), eq(missions.userId, userId)))
    .where(eq(quests.id, id))
    .limit(1);
  if (!row) return null;
  if (row.status !== "open" && !row.missionStatus) return null;
  return toView(row);
}

/** All locations with how many open quests each has. Id, name and image only. */
export async function listSites(): Promise<SiteView[]> {
  return db
    .select({
      id: locations.id,
      name: locations.name,
      image: locations.imageUrl,
      questCount: dsql<number>`count(${quests.id}) filter (where ${quests.status} = 'open' and (${quests.expiresAt} is null or ${quests.expiresAt} > now()))::int`,
    })
    .from(locations)
    .leftJoin(quests, eq(quests.locationId, locations.id))
    .groupBy(locations.id)
    .orderBy(asc(locations.name));
}

/** Id and name only, for the create-quest location select. */
export async function listLocationOptions(): Promise<{ id: string; name: string }[]> {
  return db.select({ id: locations.id, name: locations.name }).from(locations).orderBy(asc(locations.name));
}
