"use client";

import { useEffect, useState } from "react";
import type { LeaderboardPeriod, LeaderboardSnapshot } from "@/lib/queries/leaderboard";

type Snapshots = Partial<Record<LeaderboardPeriod, LeaderboardSnapshot>>;

const RECONNECT_MS = 1_000;
const MAX_BACKOFF_MS = 15_000;
const OFFLINE_AFTER_MS = 5_000;

/**
 * Live leaderboard. Starts from the server-rendered snapshot(s), then follows
 * /api/leaderboard/stream for `period`. The stream is closed while the tab is
 * hidden and reopened (with a fresh snapshot) when it is visible again.
 */
export function useLeaderboard(initial: Snapshots, period: LeaderboardPeriod) {
  const [snapshots, setSnapshots] = useState<Snapshots>(initial);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let offline: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let failures = 0;

    const close = () => {
      clearTimeout(reconnect);
      clearTimeout(offline);
      es?.close();
      es = null;
    };

    const open = () => {
      if (disposed || document.hidden) return;
      close();
      const source = new EventSource(`/api/leaderboard/stream?period=${period}`);
      es = source;
      source.onopen = () => {
        failures = 0;
        clearTimeout(offline);
        setLive(true);
      };
      source.onmessage = (e) => {
        clearTimeout(offline);
        setLive(true);
        const next = JSON.parse(e.data) as LeaderboardSnapshot;
        setSnapshots((cur) => (cur[period]?.version === next.version ? cur : { ...cur, [period]: next }));
      };
      source.onerror = () => {
        // The server closes every ~55s on purpose, so reconnect ourselves and
        // only report "offline" if it does not come back quickly.
        source.close();
        if (es === source) es = null;
        clearTimeout(offline);
        offline = setTimeout(() => setLive(false), OFFLINE_AFTER_MS);
        // Back off while the endpoint keeps failing instead of hammering it.
        reconnect = setTimeout(open, Math.min(RECONNECT_MS * 2 ** failures, MAX_BACKOFF_MS));
        failures += 1;
      };
    };

    const onVisibility = () => {
      if (document.hidden) {
        close();
        setLive(false);
      } else {
        open();
      }
    };

    open();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      close();
    };
  }, [period]);

  return { snapshot: snapshots[period] ?? null, live };
}
