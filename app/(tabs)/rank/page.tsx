import type { Metadata } from "next";
import { exchangeDepts, specialSeats } from "@/lib/mock-data";
import { CountUp } from "@/components/app/count-up";
import { Kanji, PageHeader, Segmented } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";
import { Crossfade } from "@/components/app/transitions";
import { CampusBoard } from "@/components/rank/campus-board";
import { HostelDuel, HostelsView } from "@/components/rank/hostels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Rank · Cursed Mission Board" };

const VIEWS = ["campus", "hostels", "special", "exchange"] as const;
type View = (typeof VIEWS)[number];

export default async function RankPage({ searchParams }: PageProps<"/rank">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const view: View = VIEWS.includes(raw as View) ? (raw as View) : "campus";

  return (
    <Page>
      <div className="flex flex-col gap-4 lg:gap-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader kanji="級" title="Rank" subtitle="This term · resets 1 Dec" />
          <Segmented
            label="Leaderboard view"
            value={view}
            className="mx-5 lg:mx-0 lg:w-[460px]"
            items={[
              { value: "campus", label: "Campus", href: "/rank" },
              { value: "hostels", label: "Hostels", href: "/rank?view=hostels" },
              { value: "special", label: "Special", href: "/rank?view=special" },
              { value: "exchange", label: "Exchange", href: "/rank?view=exchange" },
            ]}
          />
        </div>

        <Crossfade key={view}>
          <div>
            {view === "campus" && <CampusBoard aside={<HostelDuel compact />} />}
            {view === "hostels" && <HostelsView />}
            {view === "special" && <Special />}
            {view === "exchange" && <Exchange />}
          </div>
        </Crossfade>
      </div>
    </Page>
  );
}

function Special() {
  const held = specialSeats.filter((s) => s.name).length;
  return (
    <section className="flex flex-col gap-5 lg:items-center lg:gap-8">
      <div className="mx-6 flex flex-col gap-1 lg:mx-0 lg:max-w-[520px] lg:text-center">
        <h2 className="hidden font-display text-[22px] font-extrabold lg:block">
          Special Grade · {held} of {specialSeats.length} seats held
        </h2>
        <p className="text-[15px] leading-[1.6] text-mist-300 [text-wrap:pretty]">
          Four seats. The top four Grade 1 sorcerers on campus hold them until someone takes their place.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-[26px] gap-y-[22px] px-7 pb-8 lg:grid-cols-4 lg:gap-6 lg:px-0 lg:pb-0">
        {specialSeats.map((s, i) =>
          s.name ? (
            <div
              key={s.seat}
              className="rise-in flex h-[232px] flex-col items-center gap-2 rounded-[3px] bg-washi-100 px-2.5 py-[18px] text-center text-sumi-900 shadow-[inset_0_0_0_4px_#F2E6CB,inset_0_0_0_6px_#C22E26,0_0_26px_rgba(224,32,42,0.45)] lg:w-[180px]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="flex size-[38px] items-center justify-center rounded-full bg-seal-600 font-display text-xl font-extrabold text-washi-100">
                特
              </span>
              <span className="text-[13px] text-sumi-600">Seat {s.seat}</span>
              <span className="font-display text-xl font-extrabold leading-[1.2]">{s.name}</span>
              <span className="text-[13px] text-sumi-600">{s.dept}</span>
              <span className="mt-auto font-display text-xl font-extrabold text-seal-600">{s.ce} CE</span>
            </div>
          ) : (
            <div
              key={s.seat}
              className="rise-in flex h-[232px] flex-col items-center justify-center gap-2 rounded-[3px] border-[1.5px] border-dashed border-night-600 p-3 text-center lg:w-[180px]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <Kanji className="text-[32px] text-night-600">空</Kanji>
              <span className="text-[13px] text-mist-300">Seat {s.seat}</span>
              <span className="font-display text-lg font-extrabold">Unclaimed</span>
              <span className="text-[13px] text-mist-500">Reach Grade 1 to contest</span>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function Exchange() {
  return (
    <section className="flex flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-[720px]">
      <div className="mx-6 flex flex-col gap-1 lg:mx-0">
        <h2 className="hidden font-display text-[22px] font-extrabold lg:block">Exchange event · week 6</h2>
        <p className="text-[15px] leading-[1.6] text-mist-300">
          Schools compete on average CE per member this week.
        </p>
      </div>
      <div className="mx-5 flex flex-col gap-4 rounded-lg border border-night-700 bg-night-800 p-5 lg:mx-0 lg:p-6">
        {exchangeDepts.map((d) => (
          <div key={d.name} className="grid grid-cols-[24px_96px_minmax(0,1fr)_44px] items-center gap-3">
            <span className="font-display text-[17px] font-extrabold text-mist-300">{d.pos}</span>
            <span className={cn("text-[15px]", d.lead && "font-bold")}>{d.name}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-night-700">
              <div
                className={cn(
                  "gauge-fill h-full rounded-full",
                  d.lead ? "bg-gradient-to-r from-azure-500 to-cursed-500" : "bg-mist-500",
                )}
                style={{ width: `${d.pct}%`, animationDelay: `${d.pos * 80}ms` }}
              />
            </div>
            <span className="text-right font-display text-[15px] font-extrabold">
              <CountUp value={d.ce} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
