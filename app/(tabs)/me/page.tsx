import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Settings } from "lucide-react";
import { badges, ceHistory, fragments, me } from "@/lib/mock-data";
import { GRADES } from "@/lib/grades";
import { CeGauge, Kanji } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";

export const metadata: Metadata = { title: "Me · Cursed Mission Board" };

export default function MePage() {
  const found = fragments.filter((f) => f.found).length;
  const grade = GRADES[me.grade];

  return (
    <Page>
      <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+16px)] lg:px-0 lg:pt-0">
        <h1 className="font-display text-2xl font-extrabold lg:text-[32px]">Me</h1>
        <div className="flex gap-2">
          <Link
            href="/me/review"
            className="flex h-10 items-center gap-1.5 rounded-full border border-night-700 bg-night-800 px-3 text-[13px] font-bold hover:bg-night-700"
          >
            <Kanji className="text-base">審</Kanji>
            Review queue · {me.reviewQueue}
          </Link>
          <button
            type="button"
            aria-label="Settings"
            className="flex size-10 items-center justify-center rounded-full border border-night-700 bg-night-800"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-[30px] px-6 pb-8 pt-[22px] lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-10 lg:px-0 lg:pb-0 lg:pt-10">
        <section className="relative lg:col-start-1 lg:row-start-1">
          <div className="absolute -inset-5 bg-[radial-gradient(ellipse,rgba(91,140,255,0.3),transparent_68%)]" />
          <div className="paper relative flex flex-col gap-3.5 rounded px-5 py-[22px] shadow-[inset_0_0_0_1px_#E0CFA6,inset_0_0_0_6px_#F2E6CB,inset_0_0_0_7px_#5B3A22]">
            <div className="flex items-center gap-3.5">
              <span className="flex size-14 items-center justify-center rounded-full bg-sumi-600 font-bold text-washi-100">
                {me.initials}
              </span>
              <div className="flex flex-col">
                <span className="font-display text-xl font-extrabold">{me.name}</span>
                <span className="text-[13px] text-sumi-600">
                  {me.dept} · {me.studentId}
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="font-display text-4xl font-extrabold leading-none">{grade.label}</span>
              <span
                className="inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-bold"
                style={{ borderColor: grade.color }}
              >
                <span className="size-2 rounded-full" style={{ background: grade.color }} />
                {grade.feel}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <CeGauge value={me.ce} max={me.ceTarget} tone="paper" />
              <div className="flex justify-between text-[13px] text-sumi-600">
                <span>
                  <strong className="font-display text-[15px] font-extrabold text-sumi-900">
                    {me.ce.toLocaleString("en-US")}
                  </strong>{" "}
                  / {me.ceTarget.toLocaleString("en-US")} CE
                </span>
                <span>{me.nextTrial}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-washi-300 pt-3 text-[13px]">
              <span className="flex items-center gap-2">
                <span className="flex" aria-hidden>
                  {["bg-washi-500", "bg-washi-300", "bg-washi-500"].map((c, i) => (
                    <span
                      key={i}
                      className={`size-[26px] rounded-full ${c} shadow-[0_0_0_2px_#F2E6CB] ${i ? "-ml-1.5" : ""}`}
                    />
                  ))}
                </span>
                <strong>{me.endorsements} endorsements</strong>
              </span>
              <span className="text-sumi-600">From seniors</span>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3.5 lg:col-start-2 lg:row-start-1">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold">Badges</h2>
            <span className="text-[13px] text-cursed-300">See all 9</span>
          </div>
          <div className="grid grid-cols-4 gap-3 lg:max-w-[420px]">
            {badges.map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1.5">
                {b.locked ? (
                  <div className="flex h-[84px] w-[52px] items-center justify-center rounded-[2px] border-[1.5px] border-dashed border-night-600 text-mist-500">
                    <Lock className="size-5" aria-hidden />
                  </div>
                ) : (
                  <div className="flex h-[84px] w-[52px] items-center justify-center rounded-[2px] bg-gradient-to-br from-washi-100 to-washi-300 font-display text-2xl font-extrabold text-sumi-900 shadow-[inset_0_0_0_2px_#D9A441,inset_0_0_0_4px_#F2E6CB,inset_0_0_0_5px_#D9A441]">
                    {b.k}
                  </div>
                )}
                <span className={`text-center text-[13px] leading-[1.3] ${b.locked ? "text-mist-500" : ""}`}>
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3.5 lg:col-start-2 lg:row-start-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold">Cursed fragments</h2>
            <span className="text-[13px] text-mist-300">
              <strong className="text-mist-100">{found}</strong> of {fragments.length} found
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2.5 lg:grid-cols-10">
            {fragments.map((f, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded border ${
                  f.found ? "border-gold-400 bg-gold-400/10" : "border-night-700"
                }`}
              >
                {f.found && <span className="size-3.5 rotate-45 bg-gold-400" />}
              </div>
            ))}
          </div>
        </section>

        <section className="relative flex flex-col gap-3 overflow-hidden rounded border border-night-700 bg-night-800 p-[18px] lg:col-start-1 lg:row-start-2 lg:row-span-2 lg:self-start">
          <div className="flex items-center gap-2.5">
            <Kanji className="text-[28px] leading-none">縛</Kanji>
            <div className="flex flex-col">
              <h2 className="font-display text-lg font-extrabold">Binding vow</h2>
              <span className="text-[13px] text-mist-300">A promise you make for extra CE</span>
            </div>
          </div>
          <p className="text-[15px] leading-[1.6]">Walk 3 km every week for 4 weeks.</p>
          <div className="grid grid-cols-4 gap-1.5" aria-label="Week 2 of 4">
            <div className="h-2 rounded-full bg-cursed-500" />
            <div className="h-2 rounded-full bg-cursed-500 opacity-55" />
            <div className="h-2 rounded-full bg-night-700" />
            <div className="h-2 rounded-full bg-night-700" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-[13px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-mist-300">Keep it</span>
              <span className="font-bold text-cursed-300">+20% CE on wellness</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-mist-300">Break it</span>
              <span className="font-bold">−200 CE</span>
            </div>
          </div>
          <span className="text-[13px] text-mist-300">Week 2 of 4 · 1.8 of 3 km this week</span>
        </section>

        <section className="flex flex-col gap-1.5 lg:col-start-2 lg:row-start-3">
          <h2 className="mb-1.5 text-[17px] font-bold">CE history</h2>
          <ul>
            {ceHistory.map((h) => (
              <li key={h.t} className="flex items-center gap-3 border-b border-line py-2.5">
                <span className="flex size-[38px] flex-none items-center justify-center rounded-lg border border-night-700 bg-night-800 font-display text-lg font-extrabold">
                  {h.k}
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="text-[15px]">{h.t}</span>
                  <span className="text-[13px] text-mist-500">{h.d}</span>
                </div>
                <span className="font-display text-[15px] font-extrabold text-cursed-300">{h.ce}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}
