import type { Metadata } from "next";
import { BoardView } from "@/components/board/board-view";
import { listOpenQuests, listSites } from "@/lib/queries/quests";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mission board · Cursed Mission Board" };
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const user = await requireUser();
  const [quests, sites] = await Promise.all([listOpenQuests(user.id), listSites()]);
  return <BoardView quests={quests} sites={sites} ce={user.ce} />;
}
