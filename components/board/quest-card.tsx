import Link from "next/link";
import { Camera, Flame, MapPin, Pin, QrCode, Footprints } from "lucide-react";
import { GRADES } from "@/lib/grades";
import type { Quest } from "@/lib/mock-data";
import { CategoryTag, GradePill, ScrollCard } from "@/components/app/primitives";

const VERIFY_ICON = { photo: Camera, qr: QrCode, walk: Footprints } as const;
const VERIFY_LABEL = { photo: "Live photo", qr: "QR scan", walk: "Walk" } as const;

export function QuestCard({ quest, focus }: { quest: Quest; focus?: boolean }) {
  const g = GRADES[quest.grade];
  const Icon = VERIFY_ICON[quest.verification];
  return (
    <Link
      href={`/quests/${quest.id}`}
      className="block outline-none transition-transform focus-visible:scale-[1.01] hover:scale-[1.01]"
    >
      <ScrollCard glow={`${g.glow},${focus ? 0.6 : 0.22}`} blur={focus ? 20 : 10} bodyClassName="min-h-[132px] gap-2.5 lg:min-h-[164px] lg:p-4">
        <div className="flex items-center justify-between">
          <GradePill grade={quest.grade} />
          <CategoryTag category={quest.category} />
        </div>
        <h3 className="font-display text-xl font-extrabold leading-[1.3] text-sumi-900 lg:text-[19px]">
          {quest.title}
        </h3>
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col gap-0.5 text-[13px] text-sumi-600">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {quest.location} · {quest.distance}
            </span>
            <span className="flex items-center gap-1 lg:hidden">
              <Icon className="size-3.5" aria-hidden />
              {VERIFY_LABEL[quest.verification]}
            </span>
          </div>
          <span className="font-display text-2xl font-extrabold text-seal-600 lg:text-[22px]">
            +{quest.ce} <span className="text-sm">CE</span>
          </span>
        </div>
      </ScrollCard>
    </Link>
  );
}

export function BountyCard({ quest }: { quest: Quest }) {
  const g = GRADES[quest.grade];
  return (
    <Link href={`/quests/${quest.id}`} className="relative block">
      <span className="absolute -top-2.5 left-[30%] size-1 rounded-full bg-ember-500" />
      <span className="absolute -top-[18px] left-[62%] size-[3px] rounded-full bg-[#FFB27F]" />
      <span className="absolute -top-1.5 right-[12%] size-[3px] rounded-full bg-ember-500" />
      <ScrollCard glow="255,122,47,0.4" blur={14} burning bodyClassName="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:p-5">
        <div className="placeholder-photo hidden h-[150px] items-end rounded p-2 lg:flex">
          <span className="font-mono text-[13px] text-sumi-600">scouting photo · library steps</span>
        </div>
        <div className="flex flex-col gap-2 lg:gap-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-bold">
              <Pin className="size-4" aria-hidden />
              Daily bounty
            </span>
            <span className="flex h-6 items-center gap-1 rounded-full bg-sumi-900 px-2.5 text-[13px] font-bold text-ember-500">
              <Flame className="size-3.5" aria-hidden />
              {quest.bounty?.left}
            </span>
          </div>
          <h3 className="font-display text-xl font-extrabold leading-[1.3] text-sumi-900 lg:text-[28px] lg:leading-tight">
            {quest.title}
          </h3>
          <p className="hidden text-[15px] leading-[1.6] text-sumi-600 lg:block">{quest.description}</p>
          <div className="mt-auto flex items-end justify-between">
            <div className="flex flex-col gap-1.5 text-[13px] text-sumi-600 lg:flex-row lg:items-center lg:gap-3.5">
              <GradePill grade={quest.grade} />
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {quest.location} · {quest.distance}
              </span>
            </div>
            <span className="font-display text-2xl font-extrabold text-seal-600 lg:text-[28px]">
              +{quest.ce} <span className="text-sm">CE</span>
            </span>
          </div>
        </div>
      </ScrollCard>
      <span className="sr-only">Grade {g.label}</span>
    </Link>
  );
}
