import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, ChevronLeft, Footprints, MapPin, Plus, QrCode, Share2 } from "lucide-react";
import { questById, quests, categoryOf, me } from "@/lib/mock-data";
import { GRADES } from "@/lib/grades";
import { Action, GradePill, Kanji } from "@/components/app/primitives";

const VERIFY = {
  photo: { Icon: Camera, label: "How to verify", note: "Camera only. Gallery uploads aren't accepted." },
  qr: { Icon: QrCode, label: "How to verify", note: "Scan the code printed on the notice board." },
  walk: { Icon: Footprints, label: "How to verify", note: "Keep the app open. Distance is tracked on-device." },
} as const;

export function generateStaticParams() {
  return quests.filter((q) => !q.sealedUntil).map((q) => ({ id: q.id }));
}

export default async function QuestDetailPage({ params }: PageProps<"/quests/[id]">) {
  const { id } = await params;
  const quest = questById(id);
  if (!quest || quest.sealedUntil) notFound();

  const cat = categoryOf(quest.category);
  const v = VERIFY[quest.verification];

  return (
    <div className="flex flex-1 flex-col bg-night-950">
      <div className="rod mx-1.5 mt-[calc(env(safe-area-inset-top)+16px)] h-2.5 flex-none rounded-[5px]" />
      <div className="paper mx-3 flex-1">
        <div className="placeholder-photo relative m-3 flex h-44 items-end rounded p-2.5">
          <span className="bg-washi-100 px-1.5 py-0.5 font-mono text-[13px] text-sumi-600">
            scouting photo · {quest.location}
          </span>
          <Link
            href="/board"
            aria-label="Back to board"
            className="absolute left-2.5 top-2.5 flex size-10 items-center justify-center rounded-full bg-night-900/85 text-mist-100"
          >
            <ChevronLeft className="size-[22px]" />
          </Link>
          <button
            type="button"
            aria-label="Share"
            className="absolute right-2.5 top-2.5 flex size-10 items-center justify-center rounded-full bg-night-900/85 text-mist-100"
          >
            <Share2 className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 px-[18px] pb-40 pt-1">
          <div className="flex flex-wrap gap-2">
            <GradePill grade={quest.grade} className="h-[26px]" />
            <span className="flex h-[26px] items-center gap-[5px] rounded-full bg-washi-300 px-2.5 text-[13px] font-bold text-sumi-900">
              <Kanji className="text-[15px]">{cat.k}</Kanji>
              {cat.label}
            </span>
          </div>
          <h1 className="font-display text-[26px] font-extrabold leading-[1.25] text-sumi-900 [text-wrap:pretty]">
            {quest.title}
          </h1>
          <dl className="grid grid-cols-3 border-y border-washi-300 py-2.5 text-sumi-900">
            <div className="flex flex-col">
              <dt className="text-[13px] text-sumi-600">Reward</dt>
              <dd className="font-display text-xl font-extrabold text-seal-600">+{quest.ce} CE</dd>
            </div>
            <div className="flex flex-col border-l border-washi-300 pl-3">
              <dt className="text-[13px] text-sumi-600">Open until</dt>
              <dd className="mt-[3px] text-[15px] font-bold">{quest.until}</dd>
            </div>
            <div className="flex flex-col border-l border-washi-300 pl-3">
              <dt className="text-[13px] text-sumi-600">Distance</dt>
              <dd className="mt-[3px] text-[15px] font-bold">{quest.distance}</dd>
            </div>
          </dl>
          <p className="text-[15px] leading-[1.6] text-sumi-900 [text-wrap:pretty]">{quest.description}</p>
          <div className="ink-divider" />
          <div className="flex items-center gap-3 text-sumi-900">
            <div className="relative h-[72px] w-[88px] flex-none rounded bg-washi-500 bg-[repeating-linear-gradient(28deg,transparent_0_16px,#E0CFA6_16px_19px)]">
              <MapPin className="absolute left-[34px] top-[18px] size-6 fill-cursed-500 text-washi-100" aria-hidden />
            </div>
            <div className="flex flex-col gap-[3px]">
              <span className="flex items-center gap-1.5 text-[13px] text-sumi-600">
                <v.Icon className="size-3.5" aria-hidden />
                {v.label}
              </span>
              <span className="text-[15px] font-bold leading-[1.4]">{quest.verifyHint}</span>
              <span className="text-[13px] text-sumi-600">{v.note}</span>
            </div>
          </div>
          {quest.squad && (
            <div className="flex items-center gap-3 rounded bg-washi-300 p-3 text-sumi-900">
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
                <span className="text-[13px] text-sumi-600">{quest.squad}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[430px] items-center gap-3 border-t border-night-700 bg-night-800 px-5 pb-[30px] pt-3.5">
        {quest.squad && (
          <div className="flex flex-none flex-col">
            <span className="text-[13px] text-mist-300">Squad 1 of 2</span>
            <span className="text-[13px] font-bold text-cursed-300">Invite pending</span>
          </div>
        )}
        <Action href="/missions" size="lg" className="h-[54px] flex-1">
          Accept mission
        </Action>
      </div>
      <span className="sr-only">Grade {GRADES[quest.grade].label}</span>
    </div>
  );
}
