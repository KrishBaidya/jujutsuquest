import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { getViewer } from "@/lib/queries/session";
import { getLocation } from "@/lib/queries/locations";
import { listOpenQuests } from "@/lib/queries/quests";
import { listResidue } from "@/lib/queries/residue";
import { Btn, Empty, Screen, Section } from "@/components/ui";
import { QuestCard } from "@/components/board/quest-card";
import { ResidueGallery } from "@/components/place/residue-gallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/places/[id]">): Promise<Metadata> {
  const { id } = await params;
  const place = await getLocation(id, null);
  return { title: place?.name ?? "Place" };
}

export default async function PlacePage({ params }: PageProps<"/places/[id]">) {
  const { id } = await params;
  const user = (await getViewer())!;
  const place = await getLocation(id, user.id);
  if (!place) notFound();
  const [quests, residue] = await Promise.all([listOpenQuests(user.id), listResidue(id, user.id)]);
  const here = quests.filter((q) => q.locationId === id);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-ink-600">
        {place.imageUrl ? (
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-cover bg-center"
            style={{ backgroundImage: `url(${place.imageUrl})` }}
          />
        ) : (
          <div aria-hidden className="hatch absolute inset-0 -z-20" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-void via-void/70 to-void/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-void/80 to-transparent" />

        <div className="mx-auto flex min-h-[300px] max-w-[1180px] flex-col justify-between px-4 pb-7 pt-5 sm:px-6 lg:min-h-[400px] lg:px-10 lg:pb-10 lg:pt-8">
          <Link
            href={`/map?place=${place.id}`}
            className="flex w-fit items-center gap-1.5 border border-ink-500 bg-void/60 px-3 py-1.5 text-[13px] font-bold backdrop-blur hover:border-fg-faint"
          >
            <ArrowLeft className="size-4" aria-hidden />
            The Veil
          </Link>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="kicker mb-2 text-fg-muted">
                {place.lat.toFixed(4)}° N · {place.lng.toFixed(4)}° E
              </p>
              <h1 className="font-display text-[38px] leading-[0.95] lg:text-[64px]">{place.name}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
                <span
                  className={
                    place.cleared
                      ? "border border-bone px-2 py-0.5 font-bold uppercase tracking-wider text-bone"
                      : "border border-cursed-soft px-2 py-0.5 font-bold uppercase tracking-wider text-cursed-soft"
                  }
                >
                  {place.cleared ? "Veil lifted" : "Veiled"}
                </span>
                <span className="text-fg-muted">
                  {here.length} {here.length === 1 ? "mission" : "missions"} · {residue.length}{" "}
                  {residue.length === 1 ? "photo" : "photos"}
                </span>
              </p>
            </div>
            <span
              aria-hidden
              className="kanji text-[96px] leading-none text-bone/90 [text-shadow:0_0_40px_rgb(215_38_46/0.7)] lg:text-[160px]"
            >
              {place.kanji}
            </span>
          </div>
        </div>
      </section>

      <Screen className="lg:pt-10">
        <div className="grid gap-x-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <Section n={1} title="Missions here">
            {here.length ? (
              <div className="grid gap-4">
                {here.map((q, i) => (
                  <QuestCard key={q.id} quest={q} index={i} />
                ))}
              </div>
            ) : (
              <Empty kanji="静" title="No curses here right now">
                {place.cleared ? "You have already exorcised this place." : "Check back later, or report one."}
              </Empty>
            )}
          </Section>

          <div id="residue" className="scroll-mt-20">
            <Section
              n={2}
              title="Residue"
              right={
                <Btn href={`/places/${place.id}/residue`} size="sm">
                  <Camera className="size-4" aria-hidden />
                  Leave residue
                </Btn>
              }
            >
              <p className="-mt-2 mb-4 text-[13px] text-fg-muted">
                <span className="kanji text-blood">残穢</span> — photos students left at {place.name}. Anyone can add one;
                it shows up straight away.
              </p>
              <ResidueGallery placeId={place.id} posts={residue} />
            </Section>
          </div>
        </div>
      </Screen>
    </>
  );
}
