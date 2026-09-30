import type { Metadata } from "next";
import { getAllLeaderboards } from "@/lib/queries/leaderboard";
import { getViewer } from "@/lib/queries/session";
import { PageHead, Screen } from "@/components/ui";
import { Segmented } from "@/components/rank/controls";
import { CampusBoard } from "@/components/rank/campus-board";
import { HostelsView } from "@/components/rank/hostels";
import { SpecialSeats } from "@/components/rank/special";

export const metadata: Metadata = { title: "Rankings" };
export const dynamic = "force-dynamic";

const VIEWS = ["campus", "hostels", "special"] as const;
type View = (typeof VIEWS)[number];

export default async function RankPage({ searchParams }: PageProps<"/rank">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const view: View = VIEWS.includes(raw as View) ? (raw as View) : "campus";

  const [user, boards] = await Promise.all([getViewer(), getAllLeaderboards()]);
  const meId = user?.id ?? null;
  const meHostelId = user?.hostelId ?? null;

  return (
    <Screen>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <PageHead kanji="番付" kicker="Jujutsu High · Banzuke" title="Rankings" sub="Live standings across campus" />
        <Segmented
          label="Leaderboard view"
          value={view}
          className="mb-6 lg:mb-9 lg:w-[360px] lg:flex-none"
          items={[
            { value: "campus", label: <><span className="kanji text-[15px]">術</span> Campus</>, href: "/rank" },
            { value: "hostels", label: <><span className="kanji text-[15px]">寮</span> Hostels</>, href: "/rank?view=hostels" },
            { value: "special", label: <><span className="kanji text-[15px]">特</span> Special</>, href: "/rank?view=special" },
          ]}
        />
      </div>

      <div key={view} className="rise">
        {view === "campus" && <CampusBoard initial={boards} meId={meId} meHostelId={meHostelId} />}
        {view === "hostels" && <HostelsView initial={boards.all} meHostelId={meHostelId} />}
        {view === "special" && <SpecialSeats initial={boards.all} meId={meId} />}
      </div>
    </Screen>
  );
}
