"use server";

import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql as dsql } from "drizzle-orm";
import { db, sql } from "@/lib/db";
import {
  ceLedger,
  locations,
  missions,
  quests,
  submissions,
  users,
  type MissionStatus,
  type SubmissionStatus,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { parseDataUrl, uploadPhoto } from "@/lib/storage";
import { verifyPhoto } from "@/lib/ai/verify";
import { AUTO_DECISION_CONFIDENCE } from "@/lib/ai/model";
import {
  BLACK_FLASH_CHANCE,
  BLACK_FLASH_MULTIPLIER,
  type SubmitInput,
  type SubmitProof,
} from "./types";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function sameHash(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const fail = (error: string) => ({ ok: false as const, error });

type Decision = {
  status: SubmissionStatus;
  confidence: number | null;
  reason: string | null;
  photoKey: string | null;
};

export const submitProof: SubmitProof = async (input: SubmitInput) => {
  const user = await requireUser();
  if (!input || typeof input.questId !== "string") return fail("Unknown quest.");

  const [row] = await db
    .select({ quest: quests, location: locations })
    .from(quests)
    .innerJoin(locations, eq(locations.id, quests.locationId))
    .where(eq(quests.id, input.questId))
    .limit(1);
  if (!row) return fail("Unknown quest.");
  const { quest, location } = row;

  if (quest.status !== "open" || (quest.expiresAt && quest.expiresAt.getTime() <= Date.now())) {
    return fail("This quest is no longer open.");
  }
  if (quest.verification !== input.method) {
    return fail("This quest is verified a different way.");
  }

  const [mission] = await db
    .select()
    .from(missions)
    .where(and(eq(missions.userId, user.id), eq(missions.questId, quest.id)))
    .limit(1);
  if (!mission) return fail("Accept this quest before submitting proof.");
  if (mission.status === "completed") return fail("You already completed this quest.");
  if (mission.status === "in_review") return fail("This submission is already waiting for review.");

  // Claim the mission first so a double tap or a second tab cannot pay twice.
  const claimed = await db
    .update(missions)
    .set({ status: "in_review" })
    .where(and(eq(missions.id, mission.id), inArray(missions.status, ["accepted", "rejected"])))
    .returning({ id: missions.id });
  if (claimed.length === 0) return fail("This quest was already submitted.");
  const previousStatus = mission.status as MissionStatus;

  const release = async () => {
    try {
      await db.update(missions).set({ status: previousStatus }).where(eq(missions.id, mission.id));
    } catch {
      // best effort; the mission stays claimed and a reviewer can reset it
    }
  };

  let decision: Decision;
  try {
    if (input.method === "qr") {
      const token = typeof input.token === "string" ? input.token.trim() : "";
      if (!token || token.length > 200) {
        await release();
        return fail("Enter the code printed under the QR.");
      }
      const ok = location.qrTokenHash !== null && sameHash(sha256(token), location.qrTokenHash);
      decision = ok
        ? { status: "approved", confidence: 1, reason: null, photoKey: null }
        : {
            status: "rejected",
            confidence: null,
            reason: "That code does not belong to this location.",
            photoKey: null,
          };
    } else {
      const parsed = typeof input.photoDataUrl === "string" ? parseDataUrl(input.photoDataUrl) : null;
      if (!parsed) {
        await release();
        return fail("That photo could not be read. Take it again.");
      }
      const photoKey = await uploadPhoto("submissions", user.id, parsed.bytes, parsed.contentType);
      const verdict = await verifyPhoto({
        bytes: parsed.bytes,
        contentType: parsed.contentType,
        locationName: location.name,
        referenceDescription: location.referenceDescription,
        questTitle: quest.title,
        verifyHint: quest.verifyHint,
      });
      if (verdict && verdict.confidence >= AUTO_DECISION_CONFIDENCE) {
        if (verdict.matches && !verdict.looksLikeScreenOrReupload) {
          decision = { status: "approved", confidence: verdict.confidence, reason: verdict.reason, photoKey };
        } else {
          decision = {
            status: "rejected",
            confidence: verdict.confidence,
            reason:
              verdict.matches && verdict.looksLikeScreenOrReupload
                ? "That looks like a photo of a screen or a print. Take a fresh photo on site."
                : verdict.reason,
            photoKey,
          };
        }
      } else {
        // Low confidence, no Gemini key, or the call failed: a senior sorcerer decides.
        decision = {
          status: "in_review",
          confidence: verdict?.confidence ?? null,
          reason: verdict?.reason ?? null,
          photoKey,
        };
      }
    }
  } catch (err) {
    console.error("submitProof failed", err instanceof Error ? err.message : err);
    await release();
    return fail("Something went wrong reading your proof. Try again.");
  }

  const approved = decision.status === "approved";
  const submissionId = randomUUID();
  const blackFlash = approved && randomInt(0, 1_000_000) < BLACK_FLASH_CHANCE * 1_000_000;
  const paid = blackFlash ? Math.round(quest.ce * BLACK_FLASH_MULTIPLIER) : quest.ce;
  const missionStatus: MissionStatus =
    decision.status === "approved" ? "completed" : decision.status === "rejected" ? "rejected" : "in_review";

  try {
    // One transaction: submission, ledger rows (the trigger moves users.ce and grade), mission.
    await db.batch([
      db.insert(submissions).values({
        id: submissionId,
        missionId: mission.id,
        userId: user.id,
        questId: quest.id,
        method: input.method,
        photoKey: decision.photoKey,
        status: decision.status,
        confidence: decision.confidence,
        reason: decision.reason,
        blackFlash,
      }),
      db
        .update(missions)
        .set({ status: missionStatus, completedAt: approved ? new Date() : null })
        .where(eq(missions.id, mission.id)),
      ...(approved
        ? [
            db.insert(ceLedger).values({
              userId: user.id,
              amount: quest.ce,
              reason: "quest",
              questId: quest.id,
              submissionId,
            }),
          ]
        : []),
      ...(blackFlash
        ? [
            db.insert(ceLedger).values({
              userId: user.id,
              amount: paid - quest.ce,
              reason: "black_flash",
              questId: quest.id,
              submissionId,
              note: "Black Flash bonus",
            }),
          ]
        : []),
    ]);
  } catch (err) {
    console.error("submitProof write failed", err instanceof Error ? err.message : err);
    await release();
    return fail("Could not save your submission. Try again.");
  }

  for (const path of ["/board", "/missions", "/me", "/rank"]) revalidatePath(path);

  if (decision.status === "rejected") {
    return { ok: true, data: { status: "rejected", reason: decision.reason ?? "Not accepted." } };
  }
  if (decision.status === "in_review") return { ok: true, data: { status: "in_review" } };

  const [after] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const grade = after?.grade ?? user.grade;
  const promotedTo = grade !== user.grade ? grade : null;
  const newBadges = await awardBadges(user.id, grade, blackFlash);
  return { ok: true, data: { status: "approved", ce: paid, blackFlash, promotedTo, newBadges } };
};

const GRADE_BADGES: [string, string[]][] = [
  ["grade-3", ["g3", "g2", "semi1", "g1"]],
  ["grade-2", ["g2", "semi1", "g1"]],
  ["grade-1", ["g1"]],
];

async function awardBadges(userId: string, grade: string, blackFlash: boolean): Promise<string[]> {
  try {
    const ids = ["first-seal"];
    if (blackFlash) ids.push("black-flash");
    for (const [id, grades] of GRADE_BADGES) if (grades.includes(grade)) ids.push(id);

    const [cover] = await db
      .select({
        done: dsql<number>`count(distinct ${quests.locationId})::int`,
        total: dsql<number>`(select count(*) from ${locations})::int`,
      })
      .from(missions)
      .innerJoin(quests, eq(quests.id, missions.questId))
      .where(and(eq(missions.userId, userId), eq(missions.status, "completed")));
    if (cover && cover.total > 0 && cover.done >= cover.total) ids.push("four-corners");

    const rows = await sql`
      insert into user_badges (user_id, badge_id)
      select ${userId}::uuid, b.id from badges b where b.id = any(${ids}::text[])
      on conflict do nothing
      returning badge_id`;
    return (rows as { badge_id: string }[]).map((r) => r.badge_id);
  } catch (err) {
    console.error("awardBadges failed", err instanceof Error ? err.message : err);
    return [];
  }
}
