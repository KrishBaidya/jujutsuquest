import type { Metadata } from "next";
import { exchangeDepts, leaders, me, specialSeats } from "@/lib/mock-data";
import { GRADES } from "@/lib/grades";
import { Kanji, PageHeader, Segmented } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Rank · Cursed Mission Board" };

const VIEWS = ["campus", "special", "exchange"] as const;
type View = (typeof VIEWS)[number];

export default async function RankPage({ searchParams }: PageProps<"/rank">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const view: View = VIEWS.includes(raw as View) ? (raw as View) : "campus";

  return (
    <Page className={cn(view === "special" && "max-lg:bg-night-950 max-lg:min-h-[calc(100dvh-88px)]")}>
      <div className="lg:flex lg:flex-col lg:gap-9">
        <div className="lg:flex lg:items-end lg:justify-between">
          <PageHeader kanji="級" title="Rank" subtitle="This term · resets 1 Dec" />
          <div className="hidden items-center gap-2.5 rounded-lg border border-cursed-500 bg-night-800 px-4 py-3 lg:flex">
            <span className="text-[13px] text-mist-300">You</span>
            <span className="font-display text-xl font-extrabold text-cursed-300">#{me.campusPos}</span>
            <span className="h-5 w-px bg-night-700" />
            <span className="flex items-center gap-1.5 text-[15px]">
              <span className="size-2 rounded-full" style={{ background: GRADES[me.grade].color }} />
              {GRADES[me.grade].label}
            </span>
            <span className="font-display text-[17px] font-extrabold">{me.ce.toLocaleString("en-US")} CE</span>
          </div>
        </div>

        <Segmented
          label="Leaderboard view"
          value={view}
          className="mx-5 mb-2 mt-4 lg:hidden"
          items={[
            { value: "campus", label: "Campus", href: "/rank" },
            { value: "special", label: "Special Grade", href: "/rank?view=special" },
            { value: "exchange", label: "Exchange event", href: "/rank?view=exchange" },
          ]}
        />

        <div className="lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
          <div className={cn(view !== "campus" && "max-lg:hidden")}>
            <Campus />
          </div>
          <div className="lg:flex lg:flex-col lg:gap-10">
            <div className={cn(view !== "special" && "max-lg:hidden")}>
              <Special />
            </div>
            <div className={cn(view !== "exchange" && "max-lg:hidden")}>
              <Exchange />
            </div>
          </div>
        </div>
      </div>

      {view === "campus" && <YouBar />}
    </Page>
  );
}

function SectionTitle({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="mb-3 hidden items-baseline justify-between lg:flex">
      <h2 className="font-display text-[22px] font-extrabold">{title}</h2>
      <span className="text-[13px] text-mist-300">{meta}</span>
    </div>
  );
}

function Campus() {
  return (
    <section>
      <SectionTitle title="Campus" meta={`${me.campusSize} sorcerers`} />
      <div className="lg:rounded-lg lg:border lg:border-night-700 lg:bg-night-800 lg:px-5 lg:py-1">
        <div className="hidden grid-cols-[40px_minmax(0,1fr)_150px_90px] gap-3 border-b border-night-700 py-3 text-[13px] text-mist-500 lg:grid">
          <span>#</span>
          <span>Sorcerer</span>
          <span>Grade</span>
          <span className="text-right">CE</span>
        </div>
        <ol className="flex flex-col px-5 pb-[110px] pt-1 lg:px-0 lg:pb-0 lg:pt-0">
          {leaders.map((r) => (
            <li
              key={r.pos}
              className="flex items-center gap-3 border-b border-line py-2.5 lg:grid lg:grid-cols-[40px_minmax(0,1fr)_150px_90px] lg:py-[11px]"
            >
              <span className="w-[26px] text-center font-display text-xl font-extrabold text-mist-300 lg:w-auto lg:text-left">
                {r.pos}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-[38px] flex-none items-center justify-center rounded-full bg-night-700 text-[13px] font-bold lg:size-[34px]">
                  {r.initials}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15px] font-bold">{r.name}</span>
                  <span className="flex items-center gap-[5px] text-[13px] text-mist-300">
                    <span className="size-[7px] rounded-full lg:hidden" style={{ background: r.color }} />
                    <span className="lg:hidden">{r.grade} · </span>
                    {r.dept}
                  </span>
                </span>
              </span>
              <span className="hidden items-center gap-1.5 text-[13px] lg:flex">
                <span className="size-2 rounded-full" style={{ background: r.color }} />
                {r.grade}
              </span>
              <span className="font-display text-[17px] font-extrabold lg:text-right">{r.ce}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Special() {
  return (
    <section>
      <SectionTitle title="Special Grade" meta="2 of 4 seats held" />
      <p className="mx-6 mb-[18px] mt-2 text-[15px] leading-[1.6] text-mist-300 [text-wrap:pretty] lg:hidden">
        Four seats. The top four Grade 1 sorcerers on campus hold them until someone takes their place.
      </p>
      <div className="grid grid-cols-2 gap-x-[26px] gap-y-[22px] px-7 pb-8 lg:grid-cols-4 lg:gap-3.5 lg:px-0 lg:pb-0">
        {specialSeats.map((s) =>
          s.name ? (
            <div
              key={s.seat}
              className="flex h-[232px] flex-col items-center gap-2 rounded-[3px] bg-washi-100 px-2.5 py-[18px] text-center text-sumi-900 shadow-[inset_0_0_0_4px_#F2E6CB,inset_0_0_0_6px_#C22E26,0_0_26px_rgba(224,32,42,0.45)] lg:h-[200px] lg:gap-1.5 lg:px-1.5 lg:py-4"
            >
              <span className="flex size-[38px] items-center justify-center rounded-full bg-seal-600 font-display text-xl font-extrabold text-washi-100 lg:size-8 lg:text-[17px]">
                特
              </span>
              <span className="text-[13px] text-sumi-600">Seat {s.seat}</span>
              <span className="font-display text-xl font-extrabold leading-[1.2] lg:text-base">{s.name}</span>
              <span className="text-[13px] text-sumi-600 lg:hidden">{s.dept}</span>
              <span className="mt-auto font-display text-xl font-extrabold text-seal-600 lg:text-[15px]">
                {s.ce} <span className="lg:hidden">CE</span>
              </span>
            </div>
          ) : (
            <div
              key={s.seat}
              className="flex h-[232px] flex-col items-center justify-center gap-2 rounded-[3px] border-[1.5px] border-dashed border-night-600 p-3 text-center lg:h-[200px] lg:gap-1.5 lg:p-2"
            >
              <Kanji className="text-[32px] text-night-600 lg:text-[26px]">空</Kanji>
              <span className="text-[13px] text-mist-300">Seat {s.seat}</span>
              <span className="font-display text-lg font-extrabold lg:text-[15px]">Unclaimed</span>
              <span className="text-[13px] text-mist-500 lg:hidden">Reach Grade 1 to contest</span>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function Exchange() {
  return (
    <section>
      <SectionTitle title="Exchange event" meta="CE per member · week 6" />
      <p className="mx-6 mb-4 mt-2 text-[15px] leading-[1.6] text-mist-300 lg:hidden">
        Departments compete on average CE per member this week.
      </p>
      <div className="mx-5 flex flex-col gap-3.5 rounded-lg border border-night-700 bg-night-800 p-5 lg:mx-0">
        {exchangeDepts.map((d) => (
          <div key={d.name} className="grid grid-cols-[24px_96px_minmax(0,1fr)_44px] items-center gap-3">
            <span className="font-display text-[17px] font-extrabold text-mist-300">{d.pos}</span>
            <span className={cn("text-[15px]", d.lead && "font-bold")}>{d.name}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-night-700">
              <div
                className={cn("h-full rounded-full", d.lead ? "bg-gradient-to-r from-azure-500 to-cursed-500" : "bg-mist-500")}
                style={{ width: `${d.pct}%` }}
              />
            </div>
            <span className="text-right font-display text-[15px] font-extrabold">{d.ce}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function YouBar() {
  return (
    <div className="fixed inset-x-0 bottom-[100px] z-10 mx-auto flex w-full max-w-[430px] px-3.5 lg:hidden">
      <div className="flex w-full items-center gap-3 rounded-lg border border-cursed-500 bg-night-800 px-3.5 py-3 shadow-[0_0_24px_rgba(122,92,255,0.3)]">
        <span className="w-[30px] text-center font-display text-xl font-extrabold text-cursed-300">
          {me.campusPos}
        </span>
        <span className="flex size-[38px] flex-none items-center justify-center rounded-full bg-cursed-500 text-[13px] font-bold text-white">
          {me.initials}
        </span>
        <div className="flex flex-1 flex-col">
          <span className="text-[15px] font-bold">You</span>
          <span className="flex items-center gap-[5px] text-[13px] text-mist-300">
            <span className="size-[7px] rounded-full" style={{ background: GRADES[me.grade].color }} />
            {GRADES[me.grade].label} · {me.ceTarget - me.ce} CE to trial
          </span>
        </div>
        <span className="font-display text-[17px] font-extrabold">{me.ce.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
