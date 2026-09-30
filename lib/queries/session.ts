import "server-only";
import { cache } from "react";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { hostels, users, type User } from "@/lib/db/schema";
import { SPECIAL_SEATS, type GradeKey } from "@/lib/grades";
import { getCurrentUser } from "@/lib/session";

export const listHostels = () =>
  db
    .select({ id: hostels.id, name: hostels.name, crest: hostels.crest, color: hostels.color })
    .from(hostels)
    .orderBy(asc(hostels.name));

/** Up to two initials for avatars. */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/** Stored grade, or "special" when the student holds one of the top Grade 1 seats. */
export async function displayGrade(user: User): Promise<GradeKey> {
  if (user.grade !== "g1" || user.role !== "student") return user.grade;
  const seats = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.grade, "g1"), eq(users.role, "student")))
    .orderBy(desc(users.ce), asc(users.name), asc(users.id))
    .limit(SPECIAL_SEATS);
  return seats.some((s) => s.id === user.id) ? "special" : "g1";
}

export type Viewer = User & { initials: string; display: GradeKey };

/** The signed-in student with their display grade, once per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  return { ...user, initials: initialsOf(user.name), display: await displayGrade(user) };
});
