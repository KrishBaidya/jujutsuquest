import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Hourglass, QrCode, RotateCcw } from "lucide-react";
import { Kanji, PageHeader, ScrollCard } from "@/components/app/primitives";
import { Reveal } from "@/components/app/reveal";
import { Page } from "@/components/app/shell";
import { FORWARD } from "@/components/app/transitions";
import { CATEGORY_KANJI, relativeTime, timeLeft } from "@/components/me/format";
import { GRADES } from "@/lib/grades";
import { getMissions } from "@/lib/queries/me";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Missions · Cursed Mission Board" };
export const dynamic = "force-dynamic";

const H2 = "text-[17px] font-bold lg:font-display lg:text-[22px] lg:font-extrabold";

export default async function MissionsPage() {
  const user = await requireUser();
  const { accepted, inReview, completed, rejected } = await getMissions(user.id);
  const scan = accepted.find((m) => m.verification === "qr");
  const scanHref = scan ? `/verify/${scan.questId}` : null;

  return (
    <Page>
      <PageHeader
        kanji="命"
        title="Missions"
        subtitle={`${accepted.length} active · ${inReview.length} awaiting review`}
        right={
          scanHref && (
            <Link
              href={scanHref}
              transitionTypes={FORWARD}
              className="hidden h-11 items-center gap-2 rounded-lg bg-cursed-500 px-4 text-[15px] font-bold text-night-950 transition-colors hover:bg-[#62a2ff] lg:flex"
            >
              <QrCode className="size-5" aria-hidden />
              Scan checkpoint
            </Link>
          )
        }
      />

      <div className="flex flex-col gap-3.5 px-6 pb-32 pt-[18px] lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-12 lg:px-0 lg:pb-0 lg:pt-10">
        <section className="flex flex-col gap-3.5 lg:gap-6">
          <div className="flex items-baseline justify-between">
            <h2 className={H2}>In progress</h2>
            <span className="text-[13px] text-mist-300">{accepted.length} active</span>
          </div>

          {accepted.length === 0 && (
            <div className="flex flex-col items-start gap-2 rounded border border-night-700 bg-night-800 p-4">
              <p className="text-[15px] text-mist-300">No active missions. Pick a quest from the board.</p>
              <Link href="/board" transitionTypes={FORWARD} className="text-[15px] font-bold text-cursed-300">
                Open the board
              </Link>
            </div>
          )}

          {accepted.map((m, i) => {
            const cat = CATEGORY_KANJI[m.category];
            const left = timeLeft(m.expiresAt);
            return (
              <Link
                key={m.id}
                href={`/verify/${m.questId}`}
                transitionTypes={FORWARD}
                className="block transition-transform duration-300 hover:-translate-y-1"
              >
                <ScrollCard glow="61,139,255,0.35" blur={14} index={i} bodyClassName="gap-2.5 text-sumi-900 lg:p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[13px] text-sumi-600">
                      <Kanji className="text-base text-sumi-900">{cat?.k ?? "命"}</Kanji>
                      {cat?.label} · {GRADES[m.grade].label}
                    </span>
                    {left && (
                      <span className="flex h-6 items-center gap-1 rounded-full bg-sumi-900 px-[9px] text-[13px] font-bold text-ember-500">
                        <Clock className="size-3.5" aria-hidden />
                        {left}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-extrabold leading-[1.3] lg:text-[22px]">{m.title}</h3>
                  <div className="flex items-center justify-between text-[13px] text-sumi-600">
                    <span>
                      {m.locationName} · +{m.ce} CE
                    </span>
                    <span className="flex h-8 items-center rounded-full bg-sumi-900 px-3 font-bold text-washi-100">
                      Verify
                    </span>
                  </div>
                </ScrollCard>
              </Link>
            );
          })}
        </section>

        <div className="my-1.5 h-[3px] rounded-[50%] bg-[linear-gradient(90deg,transparent,#A69FC2_10%,#A69FC2_75%,transparent)] opacity-35 lg:hidden" />

        <div className="flex flex-col gap-3.5 lg:gap-8">
          <section className="flex flex-col gap-3.5">
            <div className="flex items-baseline justify-between">
              <h2 className={H2}>Awaiting review</h2>
              <span className="text-[13px] text-mist-300">{inReview.length}</span>
            </div>
            {inReview.length === 0 && <p className="text-[15px] text-mist-300">Nothing waiting on a senior sorcerer.</p>}
            {inReview.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded border border-night-700 bg-night-800 px-3.5 py-3">
                <div className="placeholder-photo-dark size-12 flex-none rounded" />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{p.title}</span>
                  <span className="flex items-center gap-1 text-[13px] text-mist-300">
                    <Hourglass className="size-3.5" aria-hidden />
                    With a senior sorcerer
                  </span>
                </div>
              </div>
            ))}
          </section>

          {rejected.length > 0 && (
            <section className="flex flex-col gap-3.5">
              <div className="flex items-baseline justify-between">
                <h2 className={H2}>Rejected</h2>
                <span className="text-[13px] text-mist-300">{rejected.length}</span>
              </div>
              {rejected.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded border border-night-700 bg-night-800 px-3.5 py-3">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-bold">{r.title}</span>
                    <span className="text-[13px] text-mist-300">{r.rejectReason ?? "Not accepted by the reviewer."}</span>
                  </div>
                  <Link
                    href={`/verify/${r.questId}`}
                    transitionTypes={FORWARD}
                    className="flex h-9 flex-none items-center gap-1.5 rounded-full border border-night-600 px-3 text-[13px] font-bold transition-colors hover:bg-night-700"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    Try again
                  </Link>
                </div>
              ))}
            </section>
          )}

          <section className="flex flex-col gap-2 lg:rounded-lg lg:border lg:border-night-700 lg:bg-night-800 lg:p-5">
            <div className="mt-1.5 flex items-baseline justify-between lg:mt-0">
              <h2 className={H2}>Completed</h2>
              <span className="text-[13px] text-mist-300">{completed.length} total</span>
            </div>
            {completed.length === 0 ? (
              <p className="text-[15px] text-mist-300">Finish a mission to see it here.</p>
            ) : (
              <ul>
                {completed.map((d, i) => (
                  <Reveal as="li" key={d.id} index={i} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
                    <span className="flex size-[34px] flex-none -rotate-[8deg] items-center justify-center rounded-md bg-seal-600 font-display text-lg font-extrabold text-washi-100">
                      祓
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-[15px]">{d.title}</span>
                      <span className="text-[13px] text-mist-500">
                        {d.completedAt ? relativeTime(d.completedAt) : ""}
                      </span>
                    </span>
                    <span className="font-display text-[15px] font-extrabold text-cursed-300">+{d.earned} CE</span>
                  </Reveal>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {scanHref && (
        <Link
          href={scanHref}
          transitionTypes={FORWARD}
          aria-label="Scan a QR code"
          className="fixed bottom-[104px] right-[max(20px,calc(50%-195px))] z-10 flex size-[58px] items-center justify-center rounded-full bg-cursed-500 text-night-950 shadow-[0_8px_24px_rgba(61,139,255,0.5)] transition-transform active:scale-95 lg:hidden"
        >
          <QrCode className="size-7" aria-hidden />
        </Link>
      )}
    </Page>
  );
}
