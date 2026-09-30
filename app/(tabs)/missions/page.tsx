import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Hourglass, QrCode } from "lucide-react";
import { categoryOf, missionsActive, missionsDone, missionsPending } from "@/lib/mock-data";
import { CeGauge, Kanji, PageHeader, ScrollCard } from "@/components/app/primitives";
import { Reveal } from "@/components/app/reveal";
import { Page } from "@/components/app/shell";
import { FORWARD } from "@/components/app/transitions";
import { GRADES } from "@/lib/grades";

export const metadata: Metadata = { title: "Missions · Cursed Mission Board" };

const SCAN_HREF = "/verify/club-fair?mode=qr";

export default function MissionsPage() {
  return (
    <Page>
      <PageHeader
        kanji="命"
        title="Missions"
        subtitle={`${missionsActive.length} active · ${missionsPending.length} awaiting review`}
        right={
          <Link
            href={SCAN_HREF}
            transitionTypes={FORWARD}
            className="hidden h-11 items-center gap-2 rounded-lg bg-cursed-500 px-4 text-[15px] font-bold text-white transition-colors hover:bg-[#6a4ef0] lg:flex"
          >
            <QrCode className="size-5" aria-hidden />
            Scan checkpoint
          </Link>
        }
      />

      <div className="flex flex-col gap-3.5 px-6 pb-32 pt-[18px] lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-12 lg:px-0 lg:pb-0 lg:pt-10">
        <section className="flex flex-col gap-3.5 lg:gap-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold lg:font-display lg:text-[22px] lg:font-extrabold">In progress</h2>
            <span className="text-[13px] text-mist-300">{missionsActive.length} active</span>
          </div>

          {missionsActive.map((m, i) => {
            const cat = categoryOf(m.cat);
            const href = `/verify/${m.id}?mode=${m.kind === "walk" ? "walk" : "qr"}`;
            return (
              <Link
                key={m.id}
                href={href}
                transitionTypes={FORWARD}
                className="block transition-transform duration-300 hover:-translate-y-1"
              >
                <ScrollCard
                  glow={m.kind === "walk" ? "122,92,255,0.55" : "122,92,255,0.35"}
                  blur={m.kind === "walk" ? 18 : 14}
                  pulse={m.kind === "walk"}
                  index={i}
                  bodyClassName="gap-2.5 text-sumi-900 lg:p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[13px] text-sumi-600">
                      <Kanji className="text-base text-sumi-900">{cat.k}</Kanji>
                      {cat.label} · {GRADES[m.grade].label}
                    </span>
                    {m.kind === "walk" ? (
                      <span className="flex items-center gap-[5px] text-[13px] font-bold">
                        <span className="size-2 animate-pulse rounded-full bg-cursed-500 shadow-[0_0_6px_#7A5CFF]" />
                        Tracking
                      </span>
                    ) : (
                      <span className="flex h-6 items-center gap-1 rounded-full bg-sumi-900 px-[9px] text-[13px] font-bold text-ember-500">
                        <Clock className="size-3.5" aria-hidden />
                        {m.left}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-extrabold leading-[1.3] lg:text-[22px]">{m.title}</h3>
                  {m.kind === "walk" ? (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-1 flex-col gap-1.5">
                        <span className="font-display text-[30px] font-extrabold leading-none">
                          {m.done} <span className="text-[15px] text-sumi-600">/ {m.total} m</span>
                        </span>
                        <CeGauge value={m.done} max={m.total} tone="paper" className="h-2" />
                        <span className="text-[13px] text-sumi-600">{m.total - m.done} m to go · 6 min</span>
                      </div>
                      <div className="flex h-[72px] w-24 flex-none items-center justify-center rounded bg-night-800">
                        <svg width="84" height="60" viewBox="0 0 84 60" aria-hidden>
                          <path d="M10 50 C 18 14, 50 6, 64 22 S 76 52, 42 50" fill="none" stroke="#3a3264" strokeWidth="4" strokeLinecap="round" />
                          <path d="M10 50 C 18 14, 50 6, 64 22 S 76 52, 42 50" fill="none" stroke="#B9A6FF" strokeWidth="4" strokeLinecap="round" strokeDasharray="100 200" />
                          <circle cx="68" cy="36" r="4" fill="#4C9BFF" className="animate-pulse" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-1.5">
                        {Array.from({ length: m.total }, (_, n) => (
                          <div key={n} className={`h-2 rounded-full ${n < m.done ? "bg-cursed-500" : "bg-washi-500"}`} />
                        ))}
                      </div>
                      <div className="flex justify-between text-[13px] text-sumi-600">
                        <span>
                          {m.done} of {m.total} checkpoints
                        </span>
                        <span>Next: {m.next}</span>
                      </div>
                    </>
                  )}
                </ScrollCard>
              </Link>
            );
          })}
        </section>

        <div className="my-1.5 h-[3px] rounded-[50%] bg-[linear-gradient(90deg,transparent,#A69FC2_10%,#A69FC2_75%,transparent)] opacity-35 lg:hidden" />

        <div className="flex flex-col gap-3.5 lg:gap-8">
          <section className="flex flex-col gap-3.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold lg:font-display lg:text-[22px] lg:font-extrabold">Awaiting review</h2>
              <span className="text-[13px] text-mist-300">{missionsPending.length}</span>
            </div>
            {missionsPending.map((p) => (
              <div key={p.title} className="flex items-center gap-3 rounded border border-night-700 bg-night-800 px-3.5 py-3">
                <div className="placeholder-photo-dark size-12 flex-none rounded" />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{p.title}</span>
                  <span className="flex items-center gap-1 text-[13px] text-mist-300">
                    <Hourglass className="size-3.5" aria-hidden />
                    {p.note}
                  </span>
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2 lg:rounded-lg lg:border lg:border-night-700 lg:bg-night-800 lg:p-5">
            <div className="mt-1.5 flex items-baseline justify-between lg:mt-0">
              <h2 className="text-[17px] font-bold lg:font-display lg:text-[22px] lg:font-extrabold">Completed</h2>
              <span className="text-[13px] text-mist-300">14 this term</span>
            </div>
            <ul>
              {missionsDone.map((d, i) => (
                <Reveal as="li" key={d.title} index={i} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
                  <span className="flex size-[34px] flex-none -rotate-[8deg] items-center justify-center rounded-md bg-seal-600 font-display text-lg font-extrabold text-washi-100">
                    祓
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-[15px]">{d.title}</span>
                    <span className="text-[13px] text-mist-500">{d.when}</span>
                  </span>
                  <span className="font-display text-[15px] font-extrabold text-cursed-300">{d.ce}</span>
                </Reveal>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <Link
        href={SCAN_HREF}
        transitionTypes={FORWARD}
        aria-label="Scan a QR code"
        className="fixed bottom-[104px] right-[max(20px,calc(50%-195px))] z-10 flex size-[58px] items-center justify-center rounded-full bg-cursed-500 text-white shadow-[0_8px_24px_rgba(122,92,255,0.5)] transition-transform active:scale-95 lg:hidden"
      >
        <QrCode className="size-7" aria-hidden />
      </Link>
    </Page>
  );
}
