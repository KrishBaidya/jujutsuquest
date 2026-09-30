"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { acceptQuest } from "@/lib/actions/quests";
import { Action } from "@/components/app/primitives";
import type { MissionStatus } from "@/lib/db/schema";

/** Primary button on the quest page: accept, continue, or the sealed state. */
export function AcceptButton({
  questId,
  status,
  className,
}: {
  questId: string;
  status: MissionStatus | null;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "completed") {
    return (
      <div
        className={
          "flex min-h-12 items-center justify-center gap-2 rounded-lg border border-night-700 bg-night-800 font-bold text-mist-300 " +
          (className ?? "")
        }
      >
        <CheckCircle2 className="size-5" aria-hidden />
        Sealed · mission complete
      </div>
    );
  }
  if (status === "in_review") {
    return (
      <div
        className={
          "flex min-h-12 items-center justify-center rounded-lg border border-night-700 bg-night-800 font-bold text-mist-300 " +
          (className ?? "")
        }
      >
        In review
      </div>
    );
  }
  if (status === "accepted" || status === "rejected") {
    return (
      <Action href={`/verify/${questId}`} className={className}>
        Continue to verify
      </Action>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <Action
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await acceptQuest(questId);
            if (res.ok) router.push(`/verify/${questId}`);
            else setError(res.error);
          })
        }
      >
        {pending ? "Accepting..." : "Accept mission"}
      </Action>
      {error && (
        <span role="alert" className="text-center text-[13px] text-ember-500">
          {error}
        </span>
      )}
    </div>
  );
}
