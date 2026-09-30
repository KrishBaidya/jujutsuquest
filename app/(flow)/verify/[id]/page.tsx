import { notFound } from "next/navigation";
import { questById, type Verification } from "@/lib/mock-data";
import { VerifyFlow, type Outcome } from "@/components/verify/verify-flow";

const MODES: Verification[] = ["photo", "qr", "walk"];
const OUTCOMES: Outcome[] = ["success", "rejected", "flash", "promotion"];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function VerifyPage({ params, searchParams }: PageProps<"/verify/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const quest = questById(id);
  if (!quest || quest.sealedUntil) notFound();

  const mode = first(sp.mode) as Verification;
  const outcome = first(sp.outcome) as Outcome;

  return (
    <VerifyFlow
      quest={{ id: quest.id, title: quest.title, ce: quest.ce, location: quest.location, category: quest.category }}
      initialMode={MODES.includes(mode) ? mode : quest.verification}
      forcedOutcome={OUTCOMES.includes(outcome) ? outcome : undefined}
    />
  );
}
