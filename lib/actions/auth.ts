"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { hostels, users } from "@/lib/db/schema";
import { clearSession, getCurrentUser, setSession } from "@/lib/session";
import type { SignIn, SignOut } from "./types";

// Seeded UIDs look like DEMO-0019, campus ones like BIM-2026-0417.
const UID_PATTERN = /^[A-Z0-9]{2,6}(-[A-Z0-9]{1,6}){1,3}$/;

const input = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  uid: z
    .string()
    .trim()
    .toUpperCase()
    .regex(UID_PATTERN, "Use the format BIM-2026-0417."),
  department: z.string().trim().min(1, "Choose a department.").max(60),
  hostelId: z.string().trim().min(1, "Choose a hostel.").max(60),
});

/** Finds the student by UID or creates them, then starts their session. */
export const signIn: SignIn = async (raw) => {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  const { name, uid, department, hostelId } = parsed.data;

  const [existing] = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  if (existing) {
    await setSession(existing.id);
    return { ok: true, data: { isNew: false } };
  }

  const [hostel] = await db.select({ id: hostels.id }).from(hostels).where(eq(hostels.id, hostelId)).limit(1);
  if (!hostel) return { ok: false, error: "Unknown hostel." };

  // onConflictDoNothing covers two simultaneous sign-ins with the same UID.
  const [created] = await db
    .insert(users)
    .values({ uid, name, department, hostelId })
    .onConflictDoNothing({ target: users.uid })
    .returning();
  const user = created ?? (await db.select().from(users).where(eq(users.uid, uid)).limit(1))[0];
  if (!user) return { ok: false, error: "Could not create your profile." };
  await setSession(user.id);
  return { ok: true, data: { isNew: !!created } };
};

export const signOut: SignOut = async () => {
  await clearSession();
};

/** The rank card shown right after signing in. */
export async function getSessionCard() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [hostel] = user.hostelId
    ? await db.select({ name: hostels.name }).from(hostels).where(eq(hostels.id, user.hostelId)).limit(1)
    : [];
  return { name: user.name, department: user.department, hostel: hostel?.name ?? null, ce: user.ce };
}
