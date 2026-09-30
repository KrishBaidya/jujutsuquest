import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getLocations } from "@/lib/queries/locations";

// Per-user (cleared state), so never cached.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const locations = await getLocations(user?.id ?? null);
  return NextResponse.json({ locations }, { headers: { "Cache-Control": "private, no-store" } });
}
