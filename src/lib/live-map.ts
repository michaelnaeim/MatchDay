import { MOCK_PLACES } from "./mock-data";
import { getPulseZones, jitterPulse } from "./live-simulation";
import type { HeatSource } from "./heatmap";
import { ingestLiveEvents, type IngestedEvent } from "./live-ingest";
import { ZONE_GEO } from "./zones";

export type { HeatSource };

export interface MapPulse {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heat: number;
  delta: number;
  dominantTeam: string;
  trend: "rising" | "stable" | "surge";
  venueId?: string;
  signals: { source: HeatSource; text: string }[];
}

export interface MapLivePing {
  id: string;
  lat: number;
  lng: number;
  source: HeatSource;
  title: string;
  zone: string;
  team: string;
  ts: string;
}

export interface LiveMapResponse {
  updatedAt: string;
  pulses: MapPulse[];
  pings: MapLivePing[];
  feed: MapLivePing[];
  sources: Record<HeatSource, number>;
  liveSources: { reddit: number; eventbrite: number; seeded: number };
}

const CROWD_SCORE = { high: 28, medium: 16, low: 8 };

function teamColor(team: string): string {
  if (team === "FRA") return "#2563eb";
  if (team === "SEN") return "#16a34a";
  return "#c9a84c";
}

export { teamColor };

function scoreZone(
  zone: (typeof ZONE_GEO)[0],
  pulseHeat: number,
  events: IngestedEvent[]
): MapPulse {
  const zoneEvents = events.filter((e) => e.zone === zone.id);
  const venues = MOCK_PLACES.filter((p) =>
    p.neighborhood.toLowerCase().includes(zone.name.toLowerCase().split("/")[0].trim())
  );

  let heat = pulseHeat;
  const signals: { source: HeatSource; text: string }[] = [];

  for (const e of zoneEvents) {
    heat += e.source === "eventbrite" ? 14 : e.source === "luma" ? 11 : 9;
    signals.push({ source: e.source, text: e.title });
  }
  for (const v of venues) {
    heat += CROWD_SCORE[v.crowdLevel] ?? 10;
    signals.push({ source: v.source as HeatSource, text: v.name });
  }

  const delta = Math.floor(Math.random() * 9) - 2;
  heat = Math.min(100, Math.max(18, heat + delta));

  const fra =
    zoneEvents.filter((e) => e.team === "FRA").length +
    venues.filter((v) => v.teamTags.includes("FRA")).length;
  const sen =
    zoneEvents.filter((e) => e.team === "SEN").length +
    venues.filter((v) => v.teamTags.includes("SEN")).length;

  let dominantTeam = zone.team;
  if (fra > sen + 1) dominantTeam = "FRA";
  else if (sen > fra + 1) dominantTeam = "SEN";

  const trend: MapPulse["trend"] =
    delta > 3 ? "surge" : delta < -1 ? "stable" : heat > 85 ? "surge" : "rising";

  return {
    id: zone.id,
    name: zone.name,
    lat: zone.lat,
    lng: zone.lng,
    heat,
    delta,
    dominantTeam,
    trend,
    venueId: zone.venueId,
    signals: signals.slice(0, 4),
  };
}

function countSources(events: IngestedEvent[]): Record<HeatSource, number> {
  const counts: Record<HeatSource, number> = {
    eventbrite: 0,
    luma: 0,
    reddit: 0,
    ics: 0,
    curated: 0,
  };
  for (const e of events) counts[e.source] += 1;
  for (const p of MOCK_PLACES) counts[p.source as HeatSource] += 1;
  return counts;
}

export async function buildLiveMap(teamCode?: string): Promise<LiveMapResponse> {
  const { events, liveSources } = await ingestLiveEvents();
  const pulse = jitterPulse(getPulseZones(teamCode));
  const pulseById = Object.fromEntries(pulse.map((p) => [p.id, p]));

  const pulses = ZONE_GEO.map((z) =>
    scoreZone(z, pulseById[z.id]?.intensity ?? 50, events)
  ).sort((a, b) => b.heat - a.heat);

  const now = Date.now();
  const pings: MapLivePing[] = events.slice(0, 14).map((e, i) => ({
    id: e.id,
    lat: e.lat,
    lng: e.lng,
    source: e.source,
    title: e.title,
    zone: e.zoneName,
    team: e.team,
    ts: new Date(now - i * 45000 - Math.random() * 30000).toISOString(),
  }));

  for (const p of pulses.filter((x) => x.delta > 2).slice(0, 3)) {
    pings.unshift({
      id: `surge-${p.id}-${now}`,
      lat: p.lat,
      lng: p.lng,
      source: "curated",
      title: `Surge +${p.delta}% · ${p.signals[0]?.text ?? "fan activity"}`,
      zone: p.name,
      team: p.dominantTeam,
      ts: new Date().toISOString(),
    });
  }

  return {
    updatedAt: new Date().toISOString(),
    pulses,
    pings,
    feed: pings.slice(0, 10),
    sources: countSources(events),
    liveSources,
  };
}
