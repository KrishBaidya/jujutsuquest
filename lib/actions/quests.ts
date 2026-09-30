"use server";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { locations, missions, quests } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import type { AcceptQuest, CreateQuest } from "./types";

const acceptSchema = z.string().trim().min(1).max(120);

/** Idempotent on the unique (user_id, quest_id): accepting twice returns the same mission. */
export const acceptQuest: AcceptQuest = async (questId) => {
  const parsed = acceptSchema.safeParse(questId);
  if (!parsed.success) return { ok: false, error: "Unknown quest." };
  try {
    const user = await requireUser();
    const [quest] = await db
      .select({ id: quests.id, status: quests.status, expiresAt: quests.expiresAt })
      .from(quests)
      .where(eq(quests.id, parsed.data))
      .limit(1);
    if (!quest) return { ok: false, error: "That quest does not exist." };

    const where = and(eq(missions.userId, user.id), eq(missions.questId, quest.id));
    let [mission] = await db.select({ id: missions.id }).from(missions).where(where).limit(1);
    if (!mission) {
      if (quest.status !== "open") return { ok: false, error: "That quest is not open." };
      if (quest.expiresAt && quest.expiresAt.getTime() <= Date.now()) {
        return { ok: false, error: "That quest has expired." };
      }
      await db.insert(missions).values({ userId: user.id, questId: quest.id }).onConflictDoNothing();
      [mission] = await db.select({ id: missions.id }).from(missions).where(where).limit(1);
    }
    if (!mission) return { ok: false, error: "Could not accept the quest. Try again." };

    revalidatePath("/board");
    revalidatePath("/missions");
    revalidatePath(`/quests/${quest.id}`);
    return { ok: true, data: { missionId: mission.id } };
  } catch (e) {
    console.error("acceptQuest failed", e);
    return { ok: false, error: "Could not accept the quest. Try again." };
  }
};

const createSchema = z.object({
  title: z.string().trim().min(3, "Give the quest a title.").max(80),
  description: z.string().trim().min(6, "Describe what to do.").max(600),
  category: z.enum(["explore", "wellness", "social", "skill", "event"]),
  locationId: z.string().trim().min(1, "Pick a location.").max(80),
  verification: z.enum(["photo", "qr"]),
  verifyHint: z.string().trim().max(200),
});

const DEFAULT_CE = 50;

function slugFor(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return `${base || "quest"}-${randomBytes(3).toString("hex")}`;
}

/** New quests are pending, Grade 4, 50 CE until a reviewer opens them. */
export const createQuest: CreateQuest = async (input) => {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const data = parsed.data;
  try {
    const user = await requireUser();
    const [loc] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.id, data.locationId))
      .limit(1);
    if (!loc) return { ok: false, error: "Pick a location from the list." };

    const id = slugFor(data.title);
    await db.insert(quests).values({
      id,
      title: data.title,
      description: data.description,
      category: data.category,
      grade: "g4",
      ce: DEFAULT_CE,
      locationId: loc.id,
      verification: data.verification,
      verifyHint: data.verifyHint,
      status: "pending",
      createdBy: user.id,
    });

    revalidatePath("/board");
    revalidatePath("/locations");
    return { ok: true, data: { questId: id } };
  } catch (e) {
    console.error("createQuest failed", e);
    return { ok: false, error: "Could not send the quest. Try again." };
  }
};
