import { NextRequest, NextResponse } from "next/server";
import { mockGatheringsResponse } from "@/lib/mock-data";
import type { VibeIntent } from "@/lib/types";

/**
 * Backend stub — wire to Supabase + live ingest later.
 * GET /api/gatherings?team=FRA&intent=party&lat=40.75&lng=-73.98
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const team = searchParams.get("team") ?? "FRA";
  const intent = (searchParams.get("intent") ?? "all") as VibeIntent;
  const lat = parseFloat(searchParams.get("lat") ?? "40.758");
  const lng = parseFloat(searchParams.get("lng") ?? "-73.985");

  const data = mockGatheringsResponse({ team, intent, lat, lng });
  return NextResponse.json(data);
}
