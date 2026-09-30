import { cn } from "@/lib/utils";

/** Connection state of the leaderboard stream. */
export function LiveBadge({ live, className }: { live: boolean; className?: string }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wide",
        live ? "bg-jade-500/15 text-jade-500" : "bg-night-700 text-mist-500",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-jade-500" : "bg-mist-500")} />
      {live ? "Live" : "Offline"}
    </span>
  );
}
