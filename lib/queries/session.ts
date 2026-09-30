import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { hostels } from "@/lib/db/schema";

export const listHostels = () =>
  db
    .select({ id: hostels.id, name: hostels.name, crest: hostels.crest })
    .from(hostels)
    .orderBy(asc(hostels.name));

/** Up to two initials for the nav avatar. */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
