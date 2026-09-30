import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReviewList } from "@/components/me/review-list";
import { getReviewQueue } from "@/lib/queries/me";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Review queue · Cursed Mission Board" };
export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const user = await requireUser();
  if (user.role !== "reviewer") redirect("/me");

  const queue = await getReviewQueue();
  const items = queue.map((q) => ({
    id: q.id,
    own: q.userId === user.id,
    questTitle: q.questTitle,
    questCe: q.questCe,
    locationName: q.locationName,
    studentName: q.studentName,
    studentUid: q.studentUid,
    photo: q.photo,
    confidence: q.confidence,
    reason: q.reason,
    ageMinutes: q.ageMinutes,
  }));

  return <ReviewList items={items} />;
}
