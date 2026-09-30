import { CreateQuestForm } from "@/components/board/create-quest-form";
import { listLocationOptions } from "@/lib/queries/quests";

export const dynamic = "force-dynamic";

export default async function CreateQuestPage() {
  const locations = await listLocationOptions();
  return <CreateQuestForm locations={locations} />;
}
