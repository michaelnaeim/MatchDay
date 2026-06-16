import { NextRequest, NextResponse } from "next/server";
import { buildLiveMap } from "@/lib/live-map";

/** GET /api/live-map?team=FRA — live pulses + pings for the map */
export async function GET(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team") ?? "FRA";
  const data = await buildLiveMap(team);
  return NextResponse.json(data);
}
