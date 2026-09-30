import type { Metadata } from "next";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { locations } from "@/lib/mock-data";
import { GRADES } from "@/lib/grades";
import { PageHeader } from "@/components/app/primitives";
import { Page } from "@/components/app/shell";

export const metadata: Metadata = { title: "Locations · Cursed Mission Board" };

export default function LocationsPage() {
  return (
    <Page>
      <PageHeader kanji="地" title="Locations" subtitle="Visit these sites to take on quests" />
      <ul className="grid gap-5 px-5 pb-8 pt-5 lg:grid-cols-3 lg:px-0 lg:pt-8">
        {locations.map((l) => {
          const g = GRADES[l.grade];
          return (
            <li key={l.slug} className="overflow-hidden rounded border border-night-700 bg-night-800">
              <div className="relative h-[200px] bg-night-700">
                <Image
                  src={l.image}
                  alt={l.name}
                  fill
                  sizes="(max-width: 430px) 100vw, 360px"
                  className="object-cover"
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
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
