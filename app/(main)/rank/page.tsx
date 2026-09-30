import type { Metadata } from "next";
import { getAllLeaderboards } from "@/lib/queries/leaderboard";
import { getViewer } from "@/lib/queries/session";
import { PageHead, Screen } from "@/components/ui";
import { RankView } from "@/components/rank/rank-view";

export const metadata: Metadata = { title: "Rankings" };
export const dynamic = "force-dynamic";

export default async function RankPage() {
  const [user, boards] = await Promise.all([getViewer(), getAllLeaderboards()]);
  return (
    <Screen>
      <PageHead kanji="番付" kicker="Jujutsu High · Banzuke" title="Rankings" sub="Every exorcism moves the board. Updates live." />
      <RankView initial={boards} meId={user!.id} />
    </Screen>
  );
}
