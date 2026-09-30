import type { Metadata } from "next";
import { MapView } from "@/components/map/map-view";
import { getViewer } from "@/lib/queries/session";
import { getLocations } from "@/lib/queries/locations";
import { residueByLocation } from "@/lib/queries/residue";

export const metadata: Metadata = { title: "The Veil" };
export const dynamic = "force-dynamic";

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const sp = await searchParams;
  const place = Array.isArray(sp.place) ? sp.place[0] : sp.place;
  const user = await getViewer();
  const [locations, residue] = await Promise.all([getLocations(user?.id ?? null), residueByLocation()]);
  return <MapView initialLocations={locations} residue={residue} initialPlace={place} />;
}
