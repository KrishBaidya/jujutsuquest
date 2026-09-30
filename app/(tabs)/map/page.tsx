import type { Metadata } from "next";
import { MapView } from "@/components/map/map-view";
import { PageTransition } from "@/components/app/transitions";

export const metadata: Metadata = { title: "The veil · Cursed Mission Board" };

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const sp = await searchParams;
  const place = Array.isArray(sp.place) ? sp.place[0] : sp.place;
  return (
    <PageTransition>
      <div>
        <MapView initialPlace={place} />
      </div>
    </PageTransition>
  );
}
