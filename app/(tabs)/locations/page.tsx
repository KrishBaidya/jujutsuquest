import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { campusPlaces } from "@/lib/campus";
import { GRADES } from "@/lib/grades";
import { PageHeader } from "@/components/app/primitives";
import { Reveal } from "@/components/app/reveal";
import { Page } from "@/components/app/shell";
import { BACK, FORWARD } from "@/components/app/transitions";

export const metadata: Metadata = { title: "Locations · Cursed Mission Board" };

const sites = campusPlaces.filter((p) => p.image);

export default function LocationsPage() {
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
      <ul className="grid gap-5 px-5 pb-8 pt-5 lg:grid-cols-3 lg:gap-7 lg:px-0 lg:pt-8">
        {sites.map((l, i) => {
          const g = GRADES[l.grade];
          return (
            <Reveal as="li" key={l.id} index={i}>
              <Link
                href={`/map?place=${l.id}`}
                transitionTypes={FORWARD}
                className="group block overflow-hidden rounded border border-night-700 bg-night-800 transition-colors hover:border-cursed-500"
              >
                <div className="relative h-[200px] overflow-hidden bg-night-700 lg:h-[240px]">
                  <Image
                    src={l.image!}
                    alt={l.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 360px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night-900/90 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex h-[26px] items-center gap-1.5 rounded-full bg-night-950/70 px-2.5 text-[13px] font-bold backdrop-blur">
                    <span className="size-2 rounded-full" style={{ background: g.color }} />
                    {g.label}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-lg font-extrabold">{l.name}</h2>
                    <span className="flex items-center gap-1 text-[13px] text-mist-300">
                      <MapPin className="size-3.5" aria-hidden />
                      {l.distance}
                    </span>
                  </div>
                  <p className="text-[15px] leading-[1.6] text-mist-300">{l.note}</p>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </Page>
  );
}
