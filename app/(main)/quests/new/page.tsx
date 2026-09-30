import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listLocationOptions } from "@/lib/queries/quests";
import { PageHead, Screen } from "@/components/ui";
import { ReportForm } from "@/components/board/report-form";

export const metadata: Metadata = { title: "Report a curse" };

export default async function NewQuestPage() {
  const locations = await listLocationOptions();
  return (
    <Screen className="max-w-[760px]">
      <Link href="/board" className="mb-6 flex w-fit items-center gap-1.5 text-[13px] font-bold text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden />
        Missions
      </Link>
      <PageHead
        kanji="報告"
        kicker="Field report"
        title="Report a curse"
        sub="Seen something on campus? Describe it. A senior sorcerer grades it and posts it to the board."
      />
      <ReportForm locations={locations} />
    </Screen>
  );
}
