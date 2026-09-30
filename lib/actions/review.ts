"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ceLedger, missions, quests, submissions } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { BLACK_FLASH_CHANCE, BLACK_FLASH_MULTIPLIER, type ReviewSubmission } from "./types";

export const reviewSubmission: ReviewSubmission = async (submissionId, decision) => {
  const reviewer = await requireUser();
  if (reviewer.role !== "reviewer") return { ok: false, error: "Only reviewers can review submissions." };

  const reason = decision.approve ? "" : String(decision.reason ?? "").trim();
  if (!decision.approve && !reason) return { ok: false, error: "Give a reason when rejecting." };

  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub) return { ok: false, error: "Submission not found." };
  if (sub.userId === reviewer.id) return { ok: false, error: "You cannot review your own submission." };
  if (sub.status !== "in_review") return { ok: false, error: "This submission was already reviewed." };

  try {
    if (decision.approve) {
      const [quest] = await db.select().from(quests).where(eq(quests.id, sub.questId)).limit(1);
      if (!quest) return { ok: false, error: "Quest not found." };

      const blackFlash = Math.random() < BLACK_FLASH_CHANCE;
      const bonus = blackFlash ? Math.round(quest.ce * (BLACK_FLASH_MULTIPLIER - 1)) : 0;
      // Ledger rows are inserted only while the submission is still the one
      // this reviewer just approved, so a concurrent reject cannot leave a
      // paid-but-rejected record. The unique (submission_id, reason) index
      // additionally blocks a double payout.
      const stillMine = and(
        eq(submissions.id, sub.id),
        eq(submissions.status, "approved"),
        eq(submissions.reviewedBy, reviewer.id),
      );
      const payout = (amount: number, reason: "quest" | "black_flash", note: string | null) =>
        db.insert(ceLedger).select(
          db
            .select({
              // insert-select needs every column, in table order
              id: sql<number>`nextval(pg_get_serial_sequence('ce_ledger', 'id'))`.as("id"),
              userId: submissions.userId,
              amount: sql<number>`${amount}::int`.as("amount"),
              reason: sql<string>`${reason}::text`.as("reason"),
              questId: submissions.questId,
              submissionId: submissions.id,
              note: sql<string | null>`${note}::text`.as("note"),
              createdAt: sql<Date>`now()`.as("created_at"),
            })
            .from(submissions)
            .where(stillMine),
        );
      await db.batch([
        db
          .update(submissions)
          .set({ status: "approved", reviewedBy: reviewer.id, blackFlash })
          .where(and(eq(submissions.id, sub.id), eq(submissions.status, "in_review"))),
        payout(quest.ce, "quest", null),
        ...(bonus ? [payout(bonus, "black_flash", `Black Flash x${BLACK_FLASH_MULTIPLIER}`)] : []),
        db
          .update(missions)
          .set({ status: "completed", completedAt: new Date() })
          .where(and(eq(missions.id, sub.missionId), inArray(missions.status, ["accepted", "in_review"]))),
      ]);
    } else {
      await db.batch([
        db
          .update(submissions)
          .set({ status: "rejected", reviewedBy: reviewer.id, reason })
          .where(and(eq(submissions.id, sub.id), eq(submissions.status, "in_review"))),
        db
          .update(missions)
          .set({ status: "rejected" })
          .where(and(eq(missions.id, sub.missionId), inArray(missions.status, ["accepted", "in_review"]))),
      ]);
    }
  } catch {
    // The unique (submission_id, reason) index rejects a second payout, which
    // rolls the whole batch back.
    return { ok: false, error: "This submission could not be reviewed. It may already have been." };
  }

  for (const path of ["/me", "/missions", "/me/review", "/rank", "/board"]) revalidatePath(path);
  return { ok: true };
};
