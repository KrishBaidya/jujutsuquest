import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, ChevronLeft, Footprints, MapPin, Plus, QrCode, Share2 } from "lucide-react";
import { questById, quests, categoryOf, me, type Quest } from "@/lib/mock-data";
import { Action, GradePill, Kanji } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";
import { BACK, Morph } from "@/components/app/transitions";

const VERIFY = {
  photo: { Icon: Camera, note: "Camera only. Gallery uploads aren't accepted." },
  qr: { Icon: QrCode, note: "Scan the code printed on the notice board." },
  walk: { Icon: Footprints, note: "Keep the app open. Distance is tracked on-device." },
} as const;

export function generateStaticParams() {
  return quests.filter((q) => !q.sealedUntil).map((q) => ({ id: q.id }));
}

export default async function QuestDetailPage({ params }: PageProps<"/quests/[id]">) {
  const { id } = await params;
  const quest = questById(id);
  if (!quest || quest.sealedUntil) notFound();

  const cat = categoryOf(quest.category);

  return (
    <Page className="flex flex-1 flex-col max-lg:bg-night-950">
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        {/* the unrolled scroll */}
        <article className="flex flex-1 flex-col">
          <div className="rod-lg mx-1.5 mt-[calc(env(safe-area-inset-top)+16px)] flex-none lg:mx-0 lg:mt-0" />
          <div className="paper mx-3 flex-1 lg:mx-2">
            <div className="placeholder-photo relative m-3 flex h-44 items-end rounded p-2.5 lg:m-5 lg:h-[300px]">
              <span className="bg-washi-100 px-1.5 py-0.5 font-mono text-[13px] text-sumi-600">
                scouting photo · {quest.location}
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
              {quest.squad && <Squad note={quest.squad} className="lg:hidden" />}
            </div>
          </div>
          <div className="rod-lg mx-1.5 hidden lg:mx-0 lg:block" />
        </article>

        {/* desktop action panel */}
        <aside className="sticky top-[104px] hidden flex-col gap-4 rounded-lg border border-night-700 bg-night-800 p-5 lg:flex">
          <div className="paper rounded px-4 py-1">
            <Facts quest={quest} stacked />
          </div>
          {quest.squad && <Squad note={quest.squad} />}
          {quest.squad && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-mist-300">Squad 1 of 2</span>
              <span className="font-bold text-cursed-300">Invite pending</span>
            </div>
          )}
          <Action href="/missions">Accept mission</Action>
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
        {quest.squad && (
          <div className="flex flex-none flex-col">
            <span className="text-[13px] text-mist-300">Squad 1 of 2</span>
            <span className="text-[13px] font-bold text-cursed-300">Invite pending</span>
          </div>
        )}
        <Action href="/missions" className="h-[54px] flex-1">
          Accept mission
        </Action>
      </div>
    </Page>
  );
}

function Facts({ quest, stacked, className }: { quest: Quest; stacked?: boolean; className?: string }) {
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
        <dd className="text-[15px] font-bold">{quest.until}</dd>
      </div>
      <div className={cell}>
        <dt className="text-[13px] text-sumi-600">Distance</dt>
        <dd className="text-[15px] font-bold">{quest.distance}</dd>
      </div>
    </dl>
  );
}

function HowToVerify({ quest }: { quest: Quest }) {
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

function Squad({ note, className }: { note: string; className?: string }) {
  return (
    <div className={"flex items-center gap-3 rounded bg-washi-300 p-3 text-sumi-900 " + (className ?? "")}>
      <div className="flex">
        <span className="flex size-8 items-center justify-center rounded-full bg-sumi-600 text-[13px] font-bold text-washi-100 shadow-[0_0_0_2px_#E0CFA6]">
          {me.initials}
        </span>
        <span className="-ml-2 flex size-8 items-center justify-center rounded-full border-[1.5px] border-dashed border-sumi-600 bg-washi-300">
          <Plus className="size-4" aria-hidden />
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-bold">Squad needed</span>
        <span className="text-[13px] text-sumi-600">{note}</span>
      </div>
    </div>
  );
}
