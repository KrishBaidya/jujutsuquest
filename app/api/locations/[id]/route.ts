import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getLocation } from "@/lib/queries/locations";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(_req: Request, ctx: RouteContext<"/api/locations/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  const location = await getLocation(id, user?.id ?? null);
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404, headers });
  return NextResponse.json({ location }, { headers });
}
