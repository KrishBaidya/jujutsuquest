import type { NextRequest } from "next/server";
import {
  getLeaderboard,
  isPeriod,
  type LeaderboardPeriod,
  type LeaderboardSnapshot,
} from "@/lib/queries/leaderboard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const POLL_MS = 3_000;
const HEARTBEAT_MS = 15_000;
/** Close before serverless limits do; EventSource reconnects on its own. */
const LIFETIME_MS = 55_000;

/**
 * Every open stream polls, so share one query per period across all of them:
 * database load follows the poll interval, not the number of open tabs.
 */
const shared = new Map<LeaderboardPeriod, { at: number; snapshot: Promise<LeaderboardSnapshot> }>();
function latest(period: LeaderboardPeriod) {
  const hit = shared.get(period);
  if (hit && Date.now() - hit.at < POLL_MS - 500) return hit.snapshot;
  const snapshot = getLeaderboard(period);
  shared.set(period, { at: Date.now(), snapshot });
  snapshot.catch(() => shared.delete(period));
  return snapshot;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("period");
  const period = isPeriod(raw) ? raw : "term";
  const encoder = new TextEncoder();

  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let busy = false;
      let lastVersion: string | null = null;

      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      const poll = async () => {
        if (closed || busy) return;
        busy = true;
        try {
          const snapshot = await latest(period);
          if (!closed && snapshot.version !== lastVersion) {
            lastVersion = snapshot.version;
            write(`id: ${snapshot.version}\ndata: ${JSON.stringify(snapshot)}\n\n`);
          }
        } catch {
          write(": query failed, retrying\n\n");
        } finally {
          busy = false;
        }
      };

      const pollTimer = setInterval(poll, POLL_MS);
      const beatTimer = setInterval(() => write(": heartbeat\n\n"), HEARTBEAT_MS);
      const lifeTimer = setTimeout(() => cleanup(), LIFETIME_MS);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(pollTimer);
        clearInterval(beatTimer);
        clearTimeout(lifeTimer);
        try {
          controller.close();
        } catch {
          // already closed by the client
        }
      };

      if (request.signal.aborted) return cleanup();
      request.signal.addEventListener("abort", cleanup, { once: true });

      write("retry: 3000\n\n");
      await poll();
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
