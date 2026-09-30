import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getViewer } from "@/lib/queries/session";
import { getReviewQueue } from "@/lib/queries/me";
import { Empty, PageHead, Screen } from "@/components/ui";
import { ReviewCard } from "@/components/me/review-card";

export const metadata: Metadata = { title: "Review queue" };
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = (await getViewer())!;
  if (user.role !== "reviewer") redirect("/me");
  const queue = (await getReviewQueue()).filter((s) => s.userId !== user.id);

  return (
    <Screen>
      <Link href="/me" className="mb-6 flex w-fit items-center gap-1.5 text-[13px] font-bold text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden />
        Sorcerer
      </Link>
      <PageHead
        kanji="審査"
        kicker="Senior sorcerers only"
        title="Review queue"
        sub={`${queue.length} ${queue.length === 1 ? "proof" : "proofs"} Gemini could not decide on.`}
      />
      {queue.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {queue.map((s) => (
            <ReviewCard
              key={s.id}
              sub={{
                id: s.id,
                photo: s.photo,
                questTitle: s.questTitle,
                questCe: s.questCe,
                locationName: s.locationName,
                studentName: s.studentName,
                studentUid: s.studentUid,
                confidence: s.confidence,
                reason: s.reason,
                ageMinutes: s.ageMinutes,
              }}
            />
          ))}
        </div>
      ) : (
        <Empty kanji="静" title="Queue is clear">
          Every submission has been judged. New unclear proofs will appear here.
        </Empty>
      )}
    </Screen>
  );
}
