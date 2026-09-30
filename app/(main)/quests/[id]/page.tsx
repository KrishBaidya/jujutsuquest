import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, MapPin, QrCode, Timer } from "lucide-react";
import { GRADES } from "@/lib/grades";
import { categoryOf } from "@/lib/categories";
import { getViewer } from "@/lib/queries/session";
import { getQuest } from "@/lib/queries/quests";
import { Ce, Screen, btnClass } from "@/components/ui";
import { Countdown } from "@/components/board/countdown";
import { STATUS_STAMP } from "@/components/board/quest-card";
import { AcceptButton } from "@/components/board/accept-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/quests/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await getViewer();
  const quest = user ? await getQuest(id, user.id) : null;
  return { title: quest?.title ?? "Mission" };
}

export default async function QuestPage({ params }: PageProps<"/quests/[id]">) {
  const { id } = await params;
  const user = (await getViewer())!;
  const quest = await getQuest(id, user.id);
  if (!quest) notFound();

  const g = GRADES[quest.grade];
  const cat = categoryOf(quest.category);
  const stamp = quest.missionStatus ? STATUS_STAMP[quest.missionStatus] : null;
  const isQr = quest.verification === "qr";

  return (
    <Screen className="max-w-[980px]">
      <Link href="/board" className="mb-6 flex w-fit items-center gap-1.5 text-[13px] font-bold text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden />
        Missions
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-10">
        {/* The talisman */}
        <article className="paper paper-frame relative overflow-hidden px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9">
          <span
            aria-hidden
            className="kanji pointer-events-none absolute -right-4 -top-6 text-[190px] leading-none text-blood/[0.07] sm:text-[240px]"
          >
            {cat.k}
          </span>

          <div className="relative flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-paper-muted">
            <span className="kanji text-[16px] tracking-normal text-paper-ink">{cat.k}</span>
            {cat.label.toUpperCase()}
            <span className="text-blood">·</span>
            <span className="tracking-normal">
              <span className="kanji text-[15px] text-paper-ink">{g.kanji}</span> {g.label.toUpperCase()}
            </span>
            {quest.isBounty && <span className="bg-blood px-1.5 py-px text-bone">BOUNTY</span>}
          </div>

          <h1 className="relative mt-4 font-display text-[30px] leading-[1.05] sm:text-[42px]">{quest.title}</h1>

          <Link
            href={`/places/${quest.locationId}`}
            className="relative mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-paper-muted underline decoration-blood/50 underline-offset-4 hover:text-paper-ink"
          >
            <MapPin className="size-4 text-blood" aria-hidden />
            {quest.locationName}
          </Link>

          <p className="relative mt-6 max-w-prose text-[16px] leading-relaxed">{quest.description}</p>

          {/* Binding vow: what the proof must show */}
          <div className="relative mt-7 border-l-4 border-blood bg-paper-ink/[0.06] px-4 py-3.5">
            <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-blood">
              <span className="kanji text-[16px] tracking-normal">縛り</span> BINDING VOW
            </p>
            <p className="mt-1.5 flex items-start gap-2 text-[15px]">
              {isQr ? <QrCode className="mt-0.5 size-4 flex-none" aria-hidden /> : <Camera className="mt-0.5 size-4 flex-none" aria-hidden />}
              {quest.verifyHint || (isQr ? "Scan the seal at the location." : "Photograph the location on site.")}
            </p>
            <p className="mt-1 text-[12px] text-paper-muted">
              {isQr
                ? "Find the printed talisman and scan its code in the app."
                : "Taken live in the app, checked by Gemini. Unclear shots go to a senior sorcerer."}
            </p>
          </div>

          {stamp && (
            <span
              className={`stamp-in absolute right-5 top-5 flex size-20 flex-col items-center justify-center border-[3px] ${stamp.paper} rotate-[-8deg] sm:right-8 sm:top-8 sm:size-24`}
            >
              <span className="kanji text-[40px] leading-none">{stamp.kanji}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider">{stamp.label}</span>
            </span>
          )}
        </article>

        {/* Reward + action */}
        <aside className="flex flex-col gap-4">
          <div className="panel p-5">
            <p className="kicker">Reward</p>
            <Ce value={quest.ce} sign className="mt-1 block text-[44px] leading-none text-bone" />
            <p className="mt-2 text-[12px] text-fg-muted">
              10% chance of a <span className="kanji text-blood">黒閃</span> Black Flash for ×2.5.
            </p>
            {quest.expiresAt && (
              <p className="mt-4 flex items-center gap-2 border-t border-ink-600 pt-3 text-[13px] text-blood-bright">
                <Timer className="size-4" aria-hidden />
                Ends in <Countdown to={quest.expiresAt} className="font-mono" />
              </p>
            )}
          </div>

          {quest.missionStatus === null && <AcceptButton questId={quest.id} />}
          {(quest.missionStatus === "accepted" || quest.missionStatus === "rejected") && (
            <Link href={`/verify/${quest.id}`} className={btnClass("blood", "lg", "w-full")}>
              {isQr ? <QrCode className="size-5" aria-hidden /> : <Camera className="size-5" aria-hidden />}
              {quest.missionStatus === "rejected" ? "Try again" : "Exorcise now"}
            </Link>
          )}
          {quest.missionStatus === "in_review" && (
            <p className="panel p-4 text-[14px] text-gold">Your proof is with a senior sorcerer. You will be paid once it is approved.</p>
          )}
          {quest.missionStatus === "completed" && (
            <p className="panel p-4 text-[14px] text-fg-muted">
              <span className="kanji text-blood">祓除完了</span> — exorcised. The reward is in your ledger.
            </p>
          )}

          <Link href={`/places/${quest.locationId}`} className={btnClass("ghost", "md", "w-full")}>
            <MapPin className="size-4" aria-hidden />
            See {quest.locationName}
          </Link>
        </aside>
      </div>
    </Screen>
  );
}
