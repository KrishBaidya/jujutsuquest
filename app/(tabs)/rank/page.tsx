import type { Metadata } from "next";
import { PageHeader, Segmented } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";
import { Crossfade } from "@/components/app/transitions";
import { CampusBoard } from "@/components/rank/campus-board";
import { HostelsView } from "@/components/rank/hostels";
import { SpecialSeats } from "@/components/rank/special";
import { getAllLeaderboards } from "@/lib/queries/leaderboard";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Rank · Cursed Mission Board" };
export const dynamic = "force-dynamic";

const VIEWS = ["campus", "hostels", "special"] as const;
type View = (typeof VIEWS)[number];

export default async function RankPage({ searchParams }: PageProps<"/rank">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const view: View = VIEWS.includes(raw as View) ? (raw as View) : "campus";

  const [boards, me] = await Promise.all([getAllLeaderboards(), getCurrentUser()]);
  const meId = me?.id ?? null;
  const meHostelId = me?.hostelId ?? null;

  return (
    <Page>
      <div className="flex flex-col gap-4 lg:gap-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader kanji="級" title="Rank" subtitle="Live standings across campus" />
          <Segmented
            label="Leaderboard view"
            value={view}
            className="mx-5 lg:mx-0 lg:w-[345px]"
            items={[
              { value: "campus", label: "Campus", href: "/rank" },
              { value: "hostels", label: "Hostels", href: "/rank?view=hostels" },
              { value: "special", label: "Special", href: "/rank?view=special" },
            ]}
          />
        </div>

        <Crossfade key={view}>
          <div>
            {view === "campus" && <CampusBoard initial={boards} meId={meId} meHostelId={meHostelId} />}
            {view === "hostels" && <HostelsView initial={boards.all} meHostelId={meHostelId} />}
            {view === "special" && <SpecialSeats initial={boards.all} meId={meId} />}
          </div>
        </Crossfade>
      </div>
    </Page>
  );
}
