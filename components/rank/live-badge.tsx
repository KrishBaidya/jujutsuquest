import { cn } from "@/lib/utils";

/** Connection state of the leaderboard stream. */
export function LiveBadge({ live, className }: { live: boolean; className?: string }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wide",
        live ? "bg-jade/15 text-jade" : "bg-ink-700 text-fg-faint",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-jade" : "bg-fg-faint")} />
      {live ? "Live" : "Offline"}
    </span>
  );
}
