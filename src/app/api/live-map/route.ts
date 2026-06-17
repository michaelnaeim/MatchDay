import { NextRequest, NextResponse } from "next/server";
import { buildLiveMap, type LiveMapResponse } from "@/lib/live-map";

/** Simple in-memory cache so we don't hit Reddit/Eventbrite every 8s */
let cached: { data: LiveMapResponse; ts: number; team: string } | null = null;
const CACHE_TTL_MS = 30_000; // refresh live data every 30s max

/** GET /api/live-map?team=FRA — live pulses + pings for the map */
export async function GET(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team") ?? "FRA";

  if (cached && cached.team === team && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const data = await buildLiveMap(team);
  cached = { data, ts: Date.now(), team };
  return NextResponse.json(data);
}
