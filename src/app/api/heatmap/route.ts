import { NextRequest, NextResponse } from "next/server";
import { buildHeatmap } from "@/lib/heatmap";

/**
 * GET /api/heatmap?team=FRA
 * Aggregates free sources: Eventbrite + Luma + Reddit + ICS + curated venues.
 * Re-scores on each request (live jitter). Wire Eventbrite API via EVENTBRITE_TOKEN.
 */
export async function GET(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team") ?? "FRA";

  // Future: merge live Eventbrite results when EVENTBRITE_TOKEN is set
  const data = buildHeatmap(team);
  return NextResponse.json(data);
}
