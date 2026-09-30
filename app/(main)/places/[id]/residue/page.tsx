import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocation } from "@/lib/queries/locations";
import { Screen } from "@/components/ui";
import { ResidueComposer } from "@/components/place/residue-composer";

export const metadata: Metadata = { title: "Leave residue" };

export default async function LeaveResiduePage({ params }: PageProps<"/places/[id]/residue">) {
  const { id } = await params;
  const place = await getLocation(id, null);
  if (!place) notFound();
  return (
    <Screen>
      <ResidueComposer place={{ id: place.id, name: place.name, kanji: place.kanji }} />
    </Screen>
  );
}
