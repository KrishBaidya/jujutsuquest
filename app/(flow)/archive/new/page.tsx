import { Stage } from "@/components/app/shell";
import { ShareForm } from "@/components/archive/share-form";
import { listLocationOptions } from "@/lib/queries/archive";

export const metadata = { title: "Share to the Archive" };

export default async function NewArchivePostPage() {
  const locations = await listLocationOptions();
  return (
    <Stage width="form">
      <ShareForm locations={locations} />
    </Stage>
  );
}
