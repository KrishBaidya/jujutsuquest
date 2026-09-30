import type { Metadata } from "next";
import { BoardView } from "@/components/board/board-view";

export const metadata: Metadata = { title: "Mission board · Cursed Mission Board" };

export default function BoardPage() {
  return <BoardView />;
}
