import Image from "next/image";
import Link from "next/link";
import { Camera, CheckCircle2, Flame, MapPin, Pin, QrCode } from "lucide-react";
import { GRADES } from "@/lib/grades";
import type { QuestView } from "@/lib/queries/quests";
import { CategoryTag, GradePill, ScrollCard } from "@/components/app/primitives";
import { FORWARD, Morph } from "@/components/app/transitions";
import { Countdown } from "./countdown";

const VERIFY_ICON = { photo: Camera, qr: QrCode } as const;
const VERIFY_LABEL = { photo: "Live photo", qr: "QR scan" } as const;

const STATUS_LABEL = { accepted: "Accepted", in_review: "In review", completed: "Completed" } as const;

function StatusTag({ status }: { status: QuestView["missionStatus"] }) {
  if (status !== "accepted" && status !== "in_review" && status !== "completed") return null;
  return (
    <span className="flex items-center gap-1 text-[13px] font-bold text-sumi-900">
      <CheckCircle2 className="size-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function QuestCard({ quest, focus, index = 0 }: { quest: QuestView; focus?: boolean; index?: number }) {
  const g = GRADES[quest.grade];
  const Icon = VERIFY_ICON[quest.verification];
  return (
    <Link
      href={`/quests/${quest.id}`}
      transitionTypes={FORWARD}
      className="block outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1"
    >
      <ScrollCard glow={`${g.glow},${focus ? 0.6 : 0.22}`} blur={focus ? 20 : 10} pulse={focus} index={index} bodyClassName="min-h-[132px] gap-2.5 lg:min-h-[164px] lg:p-4">
        <div className="flex items-center justify-between">
          <GradePill grade={quest.grade} />
          <CategoryTag category={quest.category} />
        </div>
        <Morph name={`quest-title-${quest.id}`}>
          <h3 className="font-display text-xl font-extrabold leading-[1.3] text-sumi-900 lg:text-[19px]">
            {quest.title}
          </h3>
        </Morph>
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col gap-0.5 text-[13px] text-sumi-600">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {quest.locationName}
            </span>
            <span className="flex items-center gap-1 lg:hidden">
              <Icon className="size-3.5" aria-hidden />
              {VERIFY_LABEL[quest.verification]}
            </span>
            <StatusTag status={quest.missionStatus} />
          </div>
          <span className="font-display text-2xl font-extrabold text-seal-600 lg:text-[22px]">
            +{quest.ce} <span className="text-sm">CE</span>
          </span>
        </div>
      </ScrollCard>
    </Link>
  );
}

export function BountyCard({ quest }: { quest: QuestView }) {
  const g = GRADES[quest.grade];
  return (
    <Link href={`/quests/${quest.id}`} transitionTypes={FORWARD} className="relative block">
      <span className="ember absolute -top-2.5 left-[30%] size-1 rounded-full bg-ember-500" />
      <span className="ember absolute -top-[18px] left-[62%] size-[3px] rounded-full bg-[#F7B488]" style={{ "--i": 1 } as React.CSSProperties} />
      <span className="ember absolute -top-1.5 right-[12%] size-[3px] rounded-full bg-ember-500" style={{ "--i": 2 } as React.CSSProperties} />
      <ScrollCard glow="240,129,58,0.4" blur={14} burning bodyClassName="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:p-5">
        <div className="placeholder-photo relative hidden h-[150px] items-end overflow-hidden rounded p-2 lg:flex">
          {quest.locationImage ? (
            <Image src={quest.locationImage} alt="" fill sizes="260px" className="object-cover" />
          ) : (
            <span className="font-mono text-[13px] text-sumi-600">{quest.locationName}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 lg:gap-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-bold">
              <Pin className="size-4" aria-hidden />
              Daily bounty
            </span>
            {quest.expiresAt && (
              <span className="flex h-6 items-center gap-1 rounded-full bg-sumi-900 px-2.5 text-[13px] font-bold text-ember-500">
                <Flame className="size-3.5" aria-hidden />
                <Countdown expiresAt={quest.expiresAt} />
              </span>
            )}
          </div>
          <Morph name={`quest-title-${quest.id}`}>
            <h3 className="font-display text-xl font-extrabold leading-[1.3] text-sumi-900 lg:text-[28px] lg:leading-tight">
              {quest.title}
            </h3>
          </Morph>
          <p className="hidden text-[15px] leading-[1.6] text-sumi-600 lg:block">{quest.description}</p>
          <div className="mt-auto flex items-end justify-between">
            <div className="flex flex-col gap-1.5 text-[13px] text-sumi-600 lg:flex-row lg:items-center lg:gap-3.5">
              <GradePill grade={quest.grade} />
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {quest.locationName}
              </span>
              <StatusTag status={quest.missionStatus} />
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
