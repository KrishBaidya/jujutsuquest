import Link from "next/link";
import { btnClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="atmosphere flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="kanji text-[120px] leading-none text-blood/80 [text-shadow:0_0_40px_rgb(215_38_46/0.5)]">無</span>
      <h1 className="font-display text-[28px]">Nothing lingers here</h1>
      <p className="max-w-sm text-fg-muted">This page was exorcised, or it never existed.</p>
      <Link href="/board" className={btnClass("blood", "md")}>
        Back to missions
      </Link>
    </main>
  );
}
