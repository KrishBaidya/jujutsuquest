"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { hostels, users } from "@/lib/db/schema";
import { clearSession, setSession } from "@/lib/session";
import { UID_EXAMPLE, parseUid } from "@/lib/uid";
import type { SignIn, SignOut } from "./types";

const input = z.object({
  name: z.string().trim().max(80),
  uid: z.string().trim().max(20),
  hostelId: z.string().trim().max(60),
});

/**
 * Finds the student by UID or enrols them, then starts their session. The
 * course in the UID becomes the student's department.
 */
export const signIn: SignIn = async (raw) => {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  const uid = parseUid(parsed.data.uid);
  if (!uid) return { ok: false, error: `Use your student UID, like ${UID_EXAMPLE}.` };

  const [existing] = await db.select().from(users).where(eq(users.uid, uid.uid)).limit(1);
  if (existing) {
    await setSession(existing.id);
    return { ok: true, data: { isNew: false } };
  }

  const { name, hostelId } = parsed.data;
  if (name.length < 2) return { ok: false, error: "No sorcerer with that UID yet. Enter your name to enrol." };
  if (!hostelId) return { ok: false, error: "Choose your hostel." };
  const [hostel] = await db.select({ id: hostels.id }).from(hostels).where(eq(hostels.id, hostelId)).limit(1);
  if (!hostel) return { ok: false, error: "Unknown hostel." };

  // onConflictDoNothing covers two simultaneous sign-ins with the same UID.
  const [created] = await db
    .insert(users)
    .values({ uid: uid.uid, name, department: uid.courseName, hostelId })
    .onConflictDoNothing({ target: users.uid })
    .returning();
  const user = created ?? (await db.select().from(users).where(eq(users.uid, uid.uid)).limit(1))[0];
  if (!user) return { ok: false, error: "Could not create your profile." };
  await setSession(user.id);
  return { ok: true, data: { isNew: !!created } };
};

export const signOut: SignOut = async () => {
  await clearSession();
};
