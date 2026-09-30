import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Lock, Settings } from "lucide-react";
import { badges, ceHistory, fragments, hostelById, me } from "@/lib/mock-data";
import { GRADES } from "@/lib/grades";
import { CountUp } from "@/components/app/count-up";
import { CeGauge, Kanji } from "@/components/app/primitives";
import { Reveal } from "@/components/app/reveal";
import { Scroller } from "@/components/app/scroller";
import { Page } from "@/components/app/shell";
import { FORWARD } from "@/components/app/transitions";

export const metadata: Metadata = { title: "Me · Cursed Mission Board" };

export default function MePage() {
  const found = fragments.filter((f) => f.found).length;
  const unlocked = badges.filter((b) => !b.locked).length;
  const grade = GRADES[me.grade];
  const hostel = hostelById(me.hostel);

  return (
    <Page>
      <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+16px)] lg:px-0 lg:pt-0">
        <h1 className="font-display text-2xl font-extrabold lg:text-[32px]">Me</h1>
        <div className="flex gap-2">
          <Link
            href="/me/review"
            transitionTypes={FORWARD}
            className="flex h-10 items-center gap-1.5 rounded-full border border-night-700 bg-night-800 px-3 text-[13px] font-bold transition-colors hover:bg-night-700"
          >
            <Kanji className="text-base">審</Kanji>
            Review queue · {me.reviewQueue}
          </Link>
          <button
            type="button"
            aria-label="Settings"
            className="flex size-10 items-center justify-center rounded-full border border-night-700 bg-night-800 transition-colors hover:bg-night-700"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      {/* Mobile is one column in design order; desktop splits into a sticky left rail and a right column. */}
      <div className="flex flex-col gap-[30px] px-6 pb-8 pt-[22px] lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-12 lg:px-0 lg:pb-0 lg:pt-10">
        <div className="max-lg:contents lg:sticky lg:top-[104px] lg:flex lg:flex-col lg:gap-8">
          <section className="relative max-lg:order-1">
            <div className="absolute -inset-5 bg-[radial-gradient(ellipse,rgba(79,163,255,0.3),transparent_68%)]" />
            <div className="paper rise-in relative flex flex-col gap-3.5 rounded px-5 py-[22px] shadow-[inset_0_0_0_1px_#DDD5C3,inset_0_0_0_6px_#EFE9DC,inset_0_0_0_7px_#4A3426]">
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
                      <CountUp value={me.ce} />
                    </strong>{" "}
                    / {me.ceTarget.toLocaleString("en-US")} CE
                  </span>
                  <span>{me.nextTrial}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-washi-300 pt-3 text-[13px]">
                <span className="flex items-center gap-2">
                  <span
                    className="flex size-[26px] items-center justify-center rounded-md font-display text-sm font-extrabold text-white"
                    style={{ background: hostel.color }}
                    aria-hidden
                  >
                    {hostel.crest}
                  </span>
                  <strong>{hostel.name} hostel</strong>
                </span>
                <span className="flex items-center gap-1 font-bold text-seal-600">
                  <Flame className="flame size-4" aria-hidden />
                  {me.streak}-day streak
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-washi-300 pt-3 text-[13px]">
                <span className="flex items-center gap-2">
                  <span className="flex" aria-hidden>
                    {["bg-washi-500", "bg-washi-300", "bg-washi-500"].map((c, i) => (
                      <span
                        key={i}
                        className={`size-[26px] rounded-full ${c} shadow-[0_0_0_2px_#EFE9DC] ${i ? "-ml-1.5" : ""}`}
                      />
                    ))}
                  </span>
                  <strong>{me.endorsements} endorsements</strong>
                </span>
                <span className="text-sumi-600">From seniors</span>
              </div>
            </div>
          </section>

          <section className="relative flex flex-col gap-3 overflow-hidden rounded border border-night-700 bg-night-800 p-[18px] max-lg:order-4">
            <div className="flex items-center gap-2.5">
              <Kanji className="text-[28px] leading-none">縛</Kanji>
              <div className="flex flex-col">
                <h2 className="font-display text-lg font-extrabold">Binding vow</h2>
                <span className="text-[13px] text-mist-300">A promise you make for extra CE</span>
              </div>
            </div>
            <p className="text-[15px] leading-[1.6]">Walk 3 km every week for 4 weeks.</p>
            <div className="grid grid-cols-4 gap-1.5" role="img" aria-label="Week 2 of 4">
              <div className="h-2 rounded-full bg-cursed-500" />
              <div className="h-2 animate-pulse rounded-full bg-cursed-500 opacity-55" />
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
        </div>

        <div className="min-w-0 max-lg:contents lg:flex lg:flex-col lg:gap-10">
          <section className="flex min-w-0 flex-col gap-3.5 max-lg:order-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold lg:font-display lg:text-[22px] lg:font-extrabold">Badges</h2>
              <span className="text-[13px] text-mist-300">
                <strong className="text-mist-100">{unlocked}</strong> of {badges.length} earned
              </span>
            </div>
            <Scroller label="Badges" className="-mx-6 lg:mx-0" trackClassName="gap-4 px-6 pb-1 lg:px-0">
              {badges.map((b) => (
                <div key={b.label} className="flex w-[68px] flex-col items-center gap-1.5">
                  {b.locked ? (
                    <div className="flex h-[84px] w-[52px] items-center justify-center rounded-[2px] border-[1.5px] border-dashed border-night-600 text-mist-500">
                      <Lock className="size-5" aria-hidden />
                    </div>
                  ) : (
                    <div className="flex h-[84px] w-[52px] items-center justify-center rounded-[2px] bg-gradient-to-br from-washi-100 to-washi-300 font-display text-2xl font-extrabold text-sumi-900 shadow-[inset_0_0_0_2px_#E0B04A,inset_0_0_0_4px_#EFE9DC,inset_0_0_0_5px_#E0B04A,0_0_16px_rgba(224,176,74,0.35)] transition-transform duration-300 hover:-translate-y-1 hover:rotate-2">
                      {b.k}
                    </div>
                  )}
                  <span className={`text-center text-[13px] leading-[1.3] ${b.locked ? "text-mist-500" : ""}`}>
                    {b.label}
                  </span>
                </div>
              ))}
            </Scroller>
          </section>

          <section className="flex flex-col gap-3.5 max-lg:order-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold lg:font-display lg:text-[22px] lg:font-extrabold">
                Cursed fragments
              </h2>
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
                  {f.found && (
                    <span className="size-3.5 rotate-45 animate-pulse bg-gold-400 shadow-[0_0_10px_#E0B04A]" />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-1.5 max-lg:order-5">
            <h2 className="mb-1.5 text-[17px] font-bold lg:font-display lg:text-[22px] lg:font-extrabold">
              CE history
            </h2>
            <ul>
              {ceHistory.map((h, i) => (
                <Reveal as="li" key={h.t} index={i} className="flex items-center gap-3 border-b border-line py-2.5">
                  <span className="flex size-[38px] flex-none items-center justify-center rounded-lg border border-night-700 bg-night-800 font-display text-lg font-extrabold">
                    {h.k}
                  </span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-[15px]">{h.t}</span>
                    <span className="text-[13px] text-mist-500">{h.d}</span>
                  </div>
                  <span className="font-display text-[15px] font-extrabold text-cursed-300">{h.ce}</span>
                </Reveal>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </Page>
  );
}
