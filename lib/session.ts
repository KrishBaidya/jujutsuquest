import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type User } from "./db/schema";

// Prototype sign-in: a student UID plus a signed cookie. This identifies a
// student; it does not authenticate them.

export const SESSION_COOKIE = "cmb_session";
const MAX_AGE = 60 * 60 * 24 * 30;

/** Seeded student used when no cookie is present outside production. */
export const DEV_FALLBACK_UID = "DEMO-0019";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set");
  return "dev-only-session-secret";
}

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

function verify(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const value = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(value));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return value;
}

/** Call from a server action or route handler only. */
export async function setSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Call from a server action or route handler only. */
export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The signed-in student, or null. Outside production, falls back to the seeded
 * demo student so pages render before onboarding exists.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const userId = verify((await cookies()).get(SESSION_COOKIE)?.value);
  if (userId) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user) return user;
  }
  if (process.env.NODE_ENV !== "production") {
    const [demo] = await db.select().from(users).where(eq(users.uid, DEV_FALLBACK_UID)).limit(1);
    return demo ?? null;
  }
  return null;
});

/** Same as getCurrentUser but throws when there is nobody signed in. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  return user;
}
