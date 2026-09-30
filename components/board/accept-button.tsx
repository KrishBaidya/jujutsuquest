"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptQuest } from "@/lib/actions/quests";
import { btnClass } from "@/components/ui";

/** Takes the vow (accepts the mission), then refreshes the page into its accepted state. */
export function AcceptButton({ questId }: { questId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await acceptQuest(questId);
            if (!res.ok) setError(res.error);
            else router.refresh();
          })
        }
        className={btnClass("blood", "lg", "w-full")}
      >
        <span className="kanji text-[20px]">誓</span>
        {pending ? "Binding…" : "Take the vow"}
      </button>
      {error && (
        <p role="alert" className="text-[13px] text-blood-bright">
          {error}
        </p>
      )}
    </div>
  );
}
