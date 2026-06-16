import type { GatheringsFilters, GatheringsResponse } from "./types";
import { mockGatheringsResponse } from "./mock-data";

/**
 * Calls GET /api/gatherings (local Next route → future Supabase + live ingest).
 * Set NEXT_PUBLIC_API_URL to point at an external backend when ready.
 */
export async function fetchGatherings(
  filters: GatheringsFilters
): Promise<GatheringsResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const params = new URLSearchParams({
    team: filters.team,
    intent: filters.intent,
    lat: String(filters.lat),
    lng: String(filters.lng),
  });
  const url = base
    ? `${base}/api/gatherings?${params}`
    : `/api/gatherings?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    return mockGatheringsResponse(filters);
  }
}

/**
 * Future: Eventbrite + Luma + ICS ingest — GET /api/events/live
 */
export async function fetchLiveEvents(team: string): Promise<{ updatedAt: string }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const url = base
    ? `${base}/api/events/live?team=${team}`
  : `/api/events/live?team=${team}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    return { updatedAt: new Date().toISOString() };
  }
}
