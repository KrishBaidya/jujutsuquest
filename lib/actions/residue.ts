"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseDataUrl, uploadPhoto } from "@/lib/storage";
import type { LeaveResidue, ToggleResidueLike } from "./types";

const { archivePosts, archiveLikes, locations, userBadges } = schema;

const leaveSchema = z.object({
  photoDataUrl: z.string().min(32),
  caption: z.string().trim().max(140, "Keep the caption under 140 characters."),
  locationId: z.string().min(1).max(64),
});

/** Posts a photo to a location's gallery. No verification: it is visible at once. */
export const leaveResidue: LeaveResidue = async (input) => {
  const user = await requireUser();
  const parsed = leaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "That photo is not valid." };
  const { caption, locationId } = parsed.data;

  const photo = parseDataUrl(parsed.data.photoDataUrl);
  if (!photo) return { ok: false, error: "The photo could not be read. Pick it again." };

  const [loc] = await db.select({ id: locations.id }).from(locations).where(eq(locations.id, locationId)).limit(1);
  if (!loc) return { ok: false, error: "That location does not exist." };

  let imageKey: string;
  try {
    imageKey = await uploadPhoto("archive", user.id, photo.bytes, photo.contentType);
  } catch (err) {
    console.error("[residue] upload failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "The photo could not be saved. Try again in a moment." };
  }

  const [post] = await db
    .insert(archivePosts)
    .values({ userId: user.id, locationId, imageKey, caption, status: "visible" })
    .returning({ id: archivePosts.id });
  await db.insert(userBadges).values({ userId: user.id, badgeId: "archivist" }).onConflictDoNothing();

  revalidatePath(`/places/${locationId}`);
  revalidatePath("/map");
  return { ok: true, data: { postId: post.id } };
};

export const toggleResidueLike: ToggleResidueLike = async (postId) => {
  const user = await requireUser();
  if (!z.uuid().safeParse(postId).success) return { ok: false, error: "Photo not found." };

  const [post] = await db
    .select({ id: archivePosts.id })
    .from(archivePosts)
    .where(and(eq(archivePosts.id, postId), eq(archivePosts.status, "visible")))
    .limit(1);
  if (!post) return { ok: false, error: "Photo not found." };

  const inserted = await db
    .insert(archiveLikes)
    .values({ postId, userId: user.id })
    .onConflictDoNothing()
    .returning({ postId: archiveLikes.postId });
  const liked = inserted.length > 0;
  if (!liked) {
    await db.delete(archiveLikes).where(and(eq(archiveLikes.postId, postId), eq(archiveLikes.userId, user.id)));
  }

  const [row] = await db.select({ n: count() }).from(archiveLikes).where(eq(archiveLikes.postId, postId));
  return { ok: true, data: { liked, likes: Number(row?.n ?? 0) } };
};
