import type { Metadata } from "next";
import { MapView } from "@/components/map/map-view";
import { PageTransition } from "@/components/app/transitions";
import { getCurrentUser } from "@/lib/session";
import { getLocations } from "@/lib/queries/locations";

export const metadata: Metadata = { title: "The veil · Cursed Mission Board" };
export const dynamic = "force-dynamic";

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const sp = await searchParams;
  const place = Array.isArray(sp.place) ? sp.place[0] : sp.place;
  const user = await getCurrentUser();
  const locations = await getLocations(user?.id ?? null);
  return (
    <PageTransition>
      <div>
        <MapView initialLocations={locations} initialPlace={place} />
      </div>
    </PageTransition>
  );
}
