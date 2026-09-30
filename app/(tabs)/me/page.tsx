import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Settings } from "lucide-react";
import { GRADES, gradeProgress, type GradeKey } from "@/lib/grades";
import { requireUser } from "@/lib/session";
import { getProfile } from "@/lib/queries/me";
import { relativeTime } from "@/components/me/format";
import { CountUp } from "@/components/app/count-up";
import { CeGauge, Kanji } from "@/components/app/primitives";
import { Reveal } from "@/components/app/reveal";
import { Scroller } from "@/components/app/scroller";
import { Page } from "@/components/app/shell";
import { FORWARD } from "@/components/app/transitions";

export const metadata: Metadata = { title: "Me · Cursed Mission Board" };
export const dynamic = "force-dynamic";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

export default async function MePage() {
  const user = await requireUser();
  const profile = await getProfile(user);
  const progress = gradeProgress(user.ce);
  const gradeKey: GradeKey = profile.special ? "special" : user.grade;
  const grade = GRADES[gradeKey];
  const earned = profile.badges.filter((b) => b.earnedAt).length;
  const nextLabel = progress.next ? GRADES[progress.next].label : null;

  return (
    <Page>
      <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+16px)] lg:px-0 lg:pt-0">
        <h1 className="font-display text-2xl font-extrabold lg:text-[32px]">Me</h1>
        <div className="flex gap-2">
          <Link
            href="/archive"
            transitionTypes={FORWARD}
            className="flex h-10 items-center gap-1.5 rounded-full border border-night-700 bg-night-800 px-3 text-[13px] font-bold transition-colors hover:bg-night-700"
          >
            <Kanji className="text-base">録</Kanji>
            Archive
          </Link>
          {user.role === "reviewer" && (
            <Link
              href="/me/review"
              transitionTypes={FORWARD}
              className="flex h-10 items-center gap-1.5 rounded-full border border-night-700 bg-night-800 px-3 text-[13px] font-bold transition-colors hover:bg-night-700"
            >
              <Kanji className="text-base">審</Kanji>
              Review queue · {profile.reviewCount}
            </Link>
          )}
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
            <div
              className="absolute -inset-5"
              style={{
                background: `radial-gradient(ellipse, rgba(${grade.glow},0.3), transparent 68%)`,
              }}
            />
            <div className="paper rise-in relative flex flex-col gap-3.5 rounded px-5 py-[22px] shadow-[inset_0_0_0_1px_#DDD5C3,inset_0_0_0_6px_#EFE9DC,inset_0_0_0_7px_#4A3426]">
              <div className="flex items-center gap-3.5">
                <span className="flex size-14 items-center justify-center rounded-full bg-sumi-600 font-bold text-washi-100">
                  {initials(user.name)}
                </span>
                <div className="flex flex-col">
                  <span className="font-display text-xl font-extrabold">{user.name}</span>
                  <span className="text-[13px] text-sumi-600">
                    {user.department} · {user.uid}
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
                  {profile.special ? "Seat holder" : grade.feel}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <CeGauge
                  value={progress.ceiling === null ? 1 : user.ce - progress.floor}
                  max={progress.ceiling === null ? 1 : progress.ceiling - progress.floor}
                  tone="paper"
                />
                <div className="flex justify-between text-[13px] text-sumi-600">
                  <span>
                    <strong className="font-display text-[15px] font-extrabold text-sumi-900">
                      <CountUp value={user.ce} />
                    </strong>{" "}
                    CE
                  </span>
                  <span>
                    {nextLabel ? `${progress.toNext.toLocaleString("en-US")} CE to ${nextLabel}` : "Top grade reached"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-washi-300 pt-3 text-[13px]">
                {profile.hostel ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="flex size-[26px] items-center justify-center rounded-md font-display text-sm font-extrabold text-white"
                      style={{ background: profile.hostel.color }}
                      aria-hidden
                    >
                      {profile.hostel.crest}
                    </span>
                    <strong>{profile.hostel.name} hostel</strong>
                  </span>
                ) : (
                  <span className="text-sumi-600">No hostel</span>
                )}
                <span className="font-bold text-seal-600">Campus rank #{profile.rank}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="min-w-0 max-lg:contents lg:flex lg:flex-col lg:gap-10">
          <section className="flex min-w-0 flex-col gap-3.5 max-lg:order-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold lg:font-display lg:text-[22px] lg:font-extrabold">Badges</h2>
              <span className="text-[13px] text-mist-300">
                <strong className="text-mist-100">{earned}</strong> of {profile.badges.length} earned
              </span>
            </div>
            <Scroller label="Badges" className="-mx-6 lg:mx-0" trackClassName="gap-4 px-6 pb-1 lg:px-0">
              {profile.badges.map((b) => (
                <div key={b.id} className="flex w-[68px] flex-col items-center gap-1.5" title={b.description}>
                  {b.earnedAt ? (
                    <div className="flex h-[84px] w-[52px] items-center justify-center rounded-[2px] bg-gradient-to-br from-washi-100 to-washi-300 font-display text-2xl font-extrabold text-sumi-900 shadow-[inset_0_0_0_2px_#E0B04A,inset_0_0_0_4px_#EFE9DC,inset_0_0_0_5px_#E0B04A,0_0_16px_rgba(224,176,74,0.35)] transition-transform duration-300 hover:-translate-y-1 hover:rotate-2">
                      {b.kanji}
                    </div>
                  ) : (
                    <div className="flex h-[84px] w-[52px] items-center justify-center rounded-[2px] border-[1.5px] border-dashed border-night-600 text-mist-500">
                      <Lock className="size-5" aria-hidden />
                    </div>
                  )}
                  <span className={`text-center text-[13px] leading-[1.3] ${b.earnedAt ? "" : "text-mist-500"}`}>
                    {b.name}
                  </span>
                </div>
              ))}
            </Scroller>
          </section>

          <section className="flex flex-col gap-1.5 max-lg:order-5">
            <h2 className="mb-1.5 text-[17px] font-bold lg:font-display lg:text-[22px] lg:font-extrabold">
              CE history
            </h2>
            {profile.history.length === 0 ? (
              <p className="py-4 text-[15px] text-mist-300">No Cursed Energy earned yet. Accept a quest to start.</p>
            ) : (
              <ul>
                {profile.history.map((h, i) => (
                  <Reveal as="li" key={h.id} index={i} className="flex items-center gap-3 border-b border-line py-2.5">
                    <span className="flex size-[38px] flex-none items-center justify-center rounded-lg border border-night-700 bg-night-800 font-display text-lg font-extrabold">
                      {h.reason === "black_flash" ? "黒" : "祓"}
                    </span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-[15px]">
                        {h.questTitle ?? h.note ?? (h.reason === "seed" ? "Starting energy" : "Adjustment")}
                      </span>
                      <span className="text-[13px] text-mist-500">
                        {h.reason === "black_flash" && <strong className="text-flash-500">Black Flash · </strong>}
                        {relativeTime(h.createdAt)}
                      </span>
                    </div>
                    <span className="font-display text-[15px] font-extrabold text-cursed-300">
                      {h.amount > 0 ? "+" : ""}
                      {h.amount.toLocaleString("en-US")} CE
                    </span>
                  </Reveal>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Page>
  );
}
