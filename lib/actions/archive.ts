"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseDataUrl, uploadPhoto } from "@/lib/storage";
import { moderatePhoto } from "@/lib/ai/moderate";
import type { ShareToArchive, ToggleArchiveLike } from "./types";

const { archivePosts, archiveLikes, userBadges } = schema;

const shareSchema = z.object({
  photoDataUrl: z.string().min(32),
  caption: z.string().trim().max(140),
  locationId: z.string().min(1).max(64).nullable(),
});

export const shareToArchive: ShareToArchive = async (input) => {
  const user = await requireUser();
  const parsed = shareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That post is not valid. Keep the caption under 140 characters." };
  const { caption, locationId } = parsed.data;

  const photo = parseDataUrl(parsed.data.photoDataUrl);
  if (!photo) return { ok: false, error: "The photo could not be read. Take it again with the camera." };

  if (locationId) {
    const [loc] = await db
      .select({ id: schema.locations.id })
      .from(schema.locations)
      .where(eq(schema.locations.id, locationId))
      .limit(1);
    if (!loc) return { ok: false, error: "That location does not exist." };
  }

  const verdict = await moderatePhoto(photo.bytes, photo.contentType);
  if (verdict && !verdict.allowed) {
    return { ok: false, error: verdict.reason || "This photo cannot be shared in the Archive." };
  }
  const status = verdict ? "visible" : "in_review";

  let imageKey: string;
  try {
    imageKey = await uploadPhoto("archive", user.id, photo.bytes, photo.contentType);
  } catch (err) {
    console.error("[archive] upload failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "The photo could not be saved. Try again in a moment." };
  }

  const [post] = await db
    .insert(archivePosts)
    .values({ userId: user.id, locationId, imageKey, caption, status })
    .returning({ id: archivePosts.id });

  if (status === "visible") {
    await db
      .insert(userBadges)
      .values({ userId: user.id, badgeId: "archivist" })
      .onConflictDoNothing();
  }

  revalidatePath("/archive");
  return { ok: true, data: { postId: post.id, status } };
};

export const toggleArchiveLike: ToggleArchiveLike = async (postId) => {
  const user = await requireUser();
  if (!z.uuid().safeParse(postId).success) return { ok: false, error: "Post not found." };

  const [post] = await db
    .select({ id: archivePosts.id })
    .from(archivePosts)
    .where(and(eq(archivePosts.id, postId), eq(archivePosts.status, "visible")))
    .limit(1);
  if (!post) return { ok: false, error: "Post not found." };

  const inserted = await db
    .insert(archiveLikes)
    .values({ postId, userId: user.id })
    .onConflictDoNothing()
    .returning({ postId: archiveLikes.postId });
  const liked = inserted.length > 0;
  if (!liked) {
    await db
      .delete(archiveLikes)
      .where(and(eq(archiveLikes.postId, postId), eq(archiveLikes.userId, user.id)));
  }

  const [row] = await db.select({ n: count() }).from(archiveLikes).where(eq(archiveLikes.postId, postId));
  return { ok: true, data: { liked, likes: Number(row?.n ?? 0) } };
};
