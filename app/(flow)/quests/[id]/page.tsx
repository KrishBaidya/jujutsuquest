import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Camera, ChevronLeft, MapPin, QrCode, Share2 } from "lucide-react";
import { categoryOf } from "@/lib/categories";
import { getQuest, type QuestView } from "@/lib/queries/quests";
import { requireUser } from "@/lib/session";
import { GradePill, Kanji } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";
import { BACK, Morph } from "@/components/app/transitions";
import { AcceptButton } from "@/components/board/accept-button";
import { Countdown } from "@/components/board/countdown";

const VERIFY = {
  photo: { Icon: Camera, note: "Camera only. Gallery uploads aren't accepted." },
  qr: { Icon: QrCode, note: "Scan the code printed at the site." },
} as const;

export const dynamic = "force-dynamic";

export default async function QuestDetailPage({ params }: PageProps<"/quests/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const quest = await getQuest(id, user.id);
  if (!quest) notFound();

  const cat = categoryOf(quest.category);

  return (
    <Page className="flex flex-1 flex-col max-lg:bg-night-950">
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        {/* the unrolled scroll */}
        <article className="flex flex-1 flex-col">
          <div className="rod-lg mx-1.5 mt-[calc(env(safe-area-inset-top)+16px)] flex-none lg:mx-0 lg:mt-0" />
          <div className="paper mx-3 flex-1 lg:mx-2">
            <div className="placeholder-photo relative m-3 flex h-44 items-end overflow-hidden rounded p-2.5 lg:m-5 lg:h-[300px]">
              {quest.locationImage && (
                <Image src={quest.locationImage} alt="" fill sizes="(min-width: 1024px) 700px, 430px" className="object-cover" />
              )}
              <span className="relative bg-washi-100 px-1.5 py-0.5 font-mono text-[13px] text-sumi-600">
                {quest.locationName}
              </span>
              <Link
                href="/board"
                transitionTypes={BACK}
                aria-label="Back to board"
                className="absolute left-2.5 top-2.5 flex size-10 items-center justify-center rounded-full bg-night-900/85 text-mist-100 transition-colors hover:bg-night-900"
              >
                <ChevronLeft className="size-[22px]" />
              </Link>
              <button
                type="button"
                aria-label="Share"
                className="absolute right-2.5 top-2.5 flex size-10 items-center justify-center rounded-full bg-night-900/85 text-mist-100 transition-colors hover:bg-night-900"
              >
                <Share2 className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 px-[18px] pb-40 pt-1 lg:gap-5 lg:px-8 lg:pb-10">
              <div className="flex flex-wrap gap-2">
                <GradePill grade={quest.grade} className="h-[26px]" />
                <span className="flex h-[26px] items-center gap-[5px] rounded-full bg-washi-300 px-2.5 text-[13px] font-bold text-sumi-900">
                  <Kanji className="text-[15px]">{cat.k}</Kanji>
                  {cat.label}
                </span>
              </div>
              <Morph name={`quest-title-${quest.id}`}>
                <h1 className="font-display text-[26px] font-extrabold leading-[1.25] text-sumi-900 [text-wrap:pretty] lg:text-[40px] lg:leading-[1.15]">
                  {quest.title}
                </h1>
              </Morph>
              <Facts quest={quest} className="lg:hidden" />
              <p className="text-[15px] leading-[1.6] text-sumi-900 [text-wrap:pretty] lg:max-w-[60ch] lg:text-[17px]">
                {quest.description}
              </p>
              <div className="ink-divider" />
              <HowToVerify quest={quest} />
            </div>
          </div>
          <div className="rod-lg mx-1.5 hidden lg:mx-0 lg:block" />
        </article>

        {/* desktop action panel */}
        <aside className="sticky top-[104px] hidden flex-col gap-4 rounded-lg border border-night-700 bg-night-800 p-5 lg:flex">
          <div className="paper rounded px-4 py-1">
            <Facts quest={quest} stacked />
          </div>
          <AcceptButton questId={quest.id} status={quest.missionStatus} />
          <Link
            href="/board"
            transitionTypes={BACK}
            className="text-center text-[13px] text-mist-300 hover:text-mist-100"
          >
            Back to board
          </Link>
        </aside>
      </div>

      {/* mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[430px] items-center gap-3 border-t border-night-700 bg-night-800 px-5 pb-[30px] pt-3.5 lg:hidden">
        <AcceptButton questId={quest.id} status={quest.missionStatus} className="h-[54px] flex-1" />
      </div>
    </Page>
  );
}

function Facts({ quest, stacked, className }: { quest: QuestView; stacked?: boolean; className?: string }) {
  const cell = stacked
    ? "flex items-baseline justify-between border-b border-washi-300 py-3 last:border-b-0"
    : "flex flex-col border-l border-washi-300 pl-3 first:border-l-0 first:pl-0";
  return (
    <dl
      className={
        (stacked ? "flex flex-col" : "grid grid-cols-3 border-y border-washi-300 py-2.5") +
        " text-sumi-900 " +
        (className ?? "")
      }
    >
      <div className={cell}>
        <dt className="text-[13px] text-sumi-600">Reward</dt>
        <dd className="font-display text-xl font-extrabold text-seal-600">+{quest.ce} CE</dd>
      </div>
      <div className={cell}>
        <dt className="text-[13px] text-sumi-600">Open until</dt>
        <dd className="text-[15px] font-bold">
          {quest.expiresAt ? <Countdown expiresAt={quest.expiresAt} /> : "No deadline"}
        </dd>
      </div>
      <div className={cell}>
        <dt className="text-[13px] text-sumi-600">Verify by</dt>
        <dd className="text-[15px] font-bold">{quest.verification === "qr" ? "QR scan" : "Live photo"}</dd>
      </div>
    </dl>
  );
}

function HowToVerify({ quest }: { quest: QuestView }) {
  const v = VERIFY[quest.verification];
  return (
    <div className="flex items-center gap-3 text-sumi-900">
      <div className="relative h-[72px] w-[88px] flex-none rounded bg-washi-500 bg-[repeating-linear-gradient(28deg,transparent_0_16px,#E0CFA6_16px_19px)]">
        <MapPin className="absolute left-[34px] top-[18px] size-6 fill-cursed-500 text-washi-100" aria-hidden />
      </div>
      <div className="flex flex-col gap-[3px]">
        <span className="flex items-center gap-1.5 text-[13px] text-sumi-600">
          <v.Icon className="size-3.5" aria-hidden />
          How to verify
        </span>
        <span className="text-[15px] font-bold leading-[1.4]">{quest.verifyHint}</span>
        <span className="text-[13px] text-sumi-600">{v.note}</span>
      </div>
    </div>
  );
}
