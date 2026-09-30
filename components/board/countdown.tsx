"use client";

import { useEffect, useState } from "react";

function left(iso: string, now: number) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 48) return `${Math.floor(h / 24)}d left`;
  if (h >= 1) return `${h}h ${String(m).padStart(2, "0")}m`;
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/** Ticking time-left label. Renders nothing until mounted so server and client agree. */
export function Countdown({ to, className }: { to: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return (
    <time dateTime={to} className={className} suppressHydrationWarning>
      {now === null ? " " : left(to, now)}
    </time>
  );
}
