import { notFound, redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { badges, locations, missions, quests } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { VerifyFlow, type Preview } from "@/components/verify/verify-flow";
import { Stage } from "@/components/app/shell";

const PREVIEWS: Preview[] = ["success", "rejected", "flash", "promotion", "review"];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function VerifyPage({ params, searchParams }: PageProps<"/verify/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();

  const [row] = await db
    .select({
      id: quests.id,
      title: quests.title,
      ce: quests.ce,
      category: quests.category,
      verification: quests.verification,
      status: quests.status,
      expired: sql<boolean>`${quests.expiresAt} is not null and ${quests.expiresAt} <= now()`,
      locationName: locations.name,
    })
    .from(quests)
    .innerJoin(locations, eq(locations.id, quests.locationId))
    .where(eq(quests.id, id))
    .limit(1);
  if (!row || row.status !== "open") notFound();

  const [mission] = await db
    .select({ status: missions.status })
    .from(missions)
    .where(and(eq(missions.userId, user.id), eq(missions.questId, id)))
    .limit(1);
  // Only an accepted quest can be verified; everything else goes back to the quest sheet.
  if (!mission || mission.status === "completed" || row.expired) redirect(`/quests/${id}`);

  const badgeNames = Object.fromEntries(
    (await db.select({ id: badges.id, name: badges.name }).from(badges)).map((b) => [b.id, b.name]),
  );

  // Dev-only ceremony preview: /verify/<id>?outcome=flash. Never active in production.
  const outcome = first(sp.outcome) as Preview;
  const preview = process.env.NODE_ENV !== "production" && PREVIEWS.includes(outcome) ? outcome : undefined;

  return (
    <Stage>
      <VerifyFlow
        quest={{
          id: row.id,
          title: row.title,
          ce: row.ce,
          location: row.locationName,
          category: row.category,
          method: row.verification,
        }}
        currentCe={user.ce}
        currentGrade={user.grade}
        badgeNames={badgeNames}
        alreadyInReview={mission.status === "in_review"}
        preview={preview}
      />
    </Stage>
  );
}
