"use client";

import { useEffect, useState } from "react";

/** "5h 12m left", "2d 3h left" or "Expired". Re-ticks every 30 s. */
export function formatLeft(ms: number) {
  if (ms <= 0) return "Expired";
  const mins = Math.floor(ms / 60_000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${Math.max(m, 1)}m left`;
}

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  // The server and client clocks differ by a few ms; the text only changes by the minute.
  return <span suppressHydrationWarning>{formatLeft(new Date(expiresAt).getTime() - now)}</span>;
}
