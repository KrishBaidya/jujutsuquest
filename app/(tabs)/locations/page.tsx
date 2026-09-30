import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Check, MapPin } from "lucide-react";
import { GRADES } from "@/lib/grades";
import { getCurrentUser } from "@/lib/session";
import { getLocations } from "@/lib/queries/locations";
import { Kanji, PageHeader } from "@/components/app/primitives";
import { Reveal } from "@/components/app/reveal";
import { Page } from "@/components/app/shell";
import { BACK, FORWARD } from "@/components/app/transitions";

export const metadata: Metadata = { title: "Locations · Cursed Mission Board" };
export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const user = await getCurrentUser();
  const sites = await getLocations(user?.id ?? null);

  return (
    <Page>
      <PageHeader
        kanji="地"
        title="Locations"
        subtitle="Visit these sites to take on quests"
        right={
          <Link
            href="/map"
            transitionTypes={BACK}
            className="flex h-10 items-center gap-1 rounded-full border border-night-700 bg-night-800 pl-2 pr-3.5 text-[13px] font-bold hover:bg-night-700"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Map
          </Link>
        }
      />
      <ul className="grid gap-5 px-5 pb-8 pt-5 lg:grid-cols-2 lg:gap-7 lg:px-0 lg:pt-8">
        {sites.map((l, i) => {
          const g = GRADES[l.topGrade];
          return (
            <Reveal as="li" key={l.id} index={i}>
              <div className="overflow-hidden rounded border border-night-700 bg-night-800">
                <Link href={`/map?place=${l.id}`} transitionTypes={FORWARD} className="group block">
                  <div className="relative h-[200px] overflow-hidden bg-night-700 lg:h-[240px]">
                    {l.imageUrl ? (
                      <Image
                        src={l.imageUrl}
                        alt={l.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 480px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(135deg, var(--color-night-800) 0 12px, var(--color-night-700) 12px 24px)",
                        }}
                      >
                        <Kanji className="text-6xl opacity-60">{l.kanji}</Kanji>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-night-900/90 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 inline-flex h-[26px] items-center gap-1.5 rounded-full bg-night-950/70 px-2.5 text-[13px] font-bold backdrop-blur">
                      <span className="size-2 rounded-full" style={{ background: g.color }} />
                      {g.label}
                    </span>
                    {l.cleared && (
                      <span className="absolute right-3 top-3 inline-flex h-[26px] items-center gap-1 rounded-full bg-night-950/70 px-2.5 text-[13px] font-bold backdrop-blur">
                        <Check className="size-3.5" aria-hidden />
                        Cleared
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between p-4 pb-2">
                    <h2 className="font-display text-lg font-extrabold">{l.name}</h2>
                    <span className="flex items-center gap-1 text-[13px] text-mist-300">
                      <MapPin className="size-3.5" aria-hidden />
                      {l.cleared ? "Veil lifted" : "Veiled"} · {l.questCount}{" "}
                      {l.questCount === 1 ? "quest" : "quests"}
                    </span>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  {l.nextQuest ? (
                    <Link
                      href={`/quests/${l.nextQuest.id}`}
                      transitionTypes={FORWARD}
                      className="flex items-center justify-between gap-2 rounded border border-night-700 bg-night-900 px-3 py-2.5 text-[15px] hover:border-cursed-500"
                    >
                      <span className="min-w-0 truncate font-bold">{l.nextQuest.title}</span>
                      <span className="flex-none font-display font-extrabold text-seal-600">
                        +{l.nextQuest.ce} CE
                      </span>
                    </Link>
                  ) : (
                    <p className="text-[13px] text-mist-300">
                      {l.cleared ? "Every quest here is done." : "No quest is posted here right now."}
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </Page>
  );
}
