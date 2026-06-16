import liveEvents from "@/data/live-events.json";
import { MOCK_PLACES } from "./mock-data";
import { getPulseZones, jitterPulse } from "./live-simulation";

export type HeatSource = "eventbrite" | "luma" | "reddit" | "ics" | "curated";

export interface HeatSignal {
  source: HeatSource;
  text: string;
}

export interface HeatCell {
  id: string;
  name: string;
  emoji: string;
  gridCol: number;
  gridRow: number;
  heat: number;
  delta: number;
  dominantTeam: string;
  trend: "rising" | "stable" | "surge";
  venueId?: string;
  signals: HeatSignal[];
}

export interface HeatFeedItem {
  id: string;
  source: HeatSource;
  zone: string;
  text: string;
  team: string;
  ts: string;
}

export interface HeatmapResponse {
  updatedAt: string;
  sources: Record<HeatSource, number>;
  cells: HeatCell[];
  feed: HeatFeedItem[];
}

interface ZoneDef {
  id: string;
  name: string;
  emoji: string;
  gridCol: number;
  gridRow: number;
  team: string;
  venueId?: string;
}

const ZONES: ZoneDef[] = [
  { id: "secaucus", name: "Secaucus / Meadowlands", emoji: "🏟️", gridCol: 1, gridRow: 2, team: "FRA", venueId: "evt-1" },
  { id: "harlem", name: "Harlem", emoji: "🇸🇳", gridCol: 3, gridRow: 1, team: "SEN" },
  { id: "yorkville", name: "Yorkville", emoji: "🇫🇷", gridCol: 4, gridRow: 1, team: "FRA", venueId: "evt-2" },
  { id: "bedstuy", name: "Bed-Stuy", emoji: "🦁", gridCol: 3, gridRow: 3, team: "SEN" },
  { id: "ues", name: "Upper East Side", emoji: "🎬", gridCol: 5, gridRow: 1, team: "FRA", venueId: "evt-3" },
  { id: "penn", name: "Penn Station", emoji: "⚠️", gridCol: 3, gridRow: 2, team: "neutral" },
  { id: "chelsea", name: "Chelsea", emoji: "🗽", gridCol: 2, gridRow: 2, team: "neutral" },
  { id: "astoria", name: "Astoria", emoji: "🇧🇷", gridCol: 5, gridRow: 0, team: "BRA", venueId: "bra-1" },
  { id: "corona", name: "Corona", emoji: "🇲🇽", gridCol: 5, gridRow: 3, team: "MEX", venueId: "mex-1" },
  { id: "times_sq", name: "Times Square", emoji: "🌆", gridCol: 3, gridRow: 1, team: "neutral" },
];

const CROWD_SCORE = { high: 30, medium: 18, low: 8 };

function countSources(): Record<HeatSource, number> {
  const counts: Record<HeatSource, number> = {
    eventbrite: 0,
    luma: 0,
    reddit: 0,
    ics: 0,
    curated: 0,
  };
  for (const e of liveEvents) {
    const s = e.source as HeatSource;
    if (s in counts) counts[s] += 1;
  }
  for (const p of MOCK_PLACES) {
    const s = p.source as HeatSource;
    if (s in counts) counts[s] += 1;
  }
  return counts;
}

function eventsForZone(zoneId: string) {
  return liveEvents.filter((e) => e.zone === zoneId);
}

function venuesForZone(zoneId: string, zoneName: string) {
  const key = zoneId.replace("_", " ");
  return MOCK_PLACES.filter(
    (p) =>
      p.neighborhood.toLowerCase().includes(key) ||
      p.neighborhood.toLowerCase().includes(zoneName.toLowerCase().split("/")[0].trim())
  );
}

function scoreZone(zone: ZoneDef, pulseHeat: number): HeatCell {
  const events = eventsForZone(zone.id);
  const venues = venuesForZone(zone.id, zone.name);

  let heat = pulseHeat;
  const signals: HeatSignal[] = [];

  for (const e of events) {
    heat += e.source === "eventbrite" ? 14 : e.source === "luma" ? 12 : 8;
    signals.push({
      source: e.source as HeatSource,
      text: e.title,
    });
  }

  for (const v of venues) {
    heat += CROWD_SCORE[v.crowdLevel] ?? 10;
    if (v.confidence === "confirmed") heat += 6;
    signals.push({
      source: (v.source as HeatSource) || "curated",
      text: v.name,
    });
  }

  heat = Math.min(100, Math.max(15, heat));
  const delta = Math.floor(Math.random() * 11) - 3;

  const fra = events.filter((e) => e.team === "FRA").length +
    venues.filter((v) => v.teamTags.includes("FRA")).length;
  const sen = events.filter((e) => e.team === "SEN").length +
    venues.filter((v) => v.teamTags.includes("SEN")).length;

  let dominantTeam = zone.team;
  if (fra > sen + 1) dominantTeam = "FRA";
  else if (sen > fra + 1) dominantTeam = "SEN";

  const trend: HeatCell["trend"] =
    delta > 3 ? "surge" : delta < -1 ? "stable" : pulseHeat > 85 ? "surge" : "rising";

  return {
    id: zone.id,
    name: zone.name,
    emoji: zone.emoji,
    gridCol: zone.gridCol,
    gridRow: zone.gridRow,
    heat: Math.min(100, heat + delta),
    delta,
    dominantTeam,
    trend,
    venueId: zone.venueId,
    signals: signals.slice(0, 4),
  };
}

function buildFeed(cells: HeatCell[]): HeatFeedItem[] {
  const items: HeatFeedItem[] = [];
  const now = Date.now();

  for (const e of liveEvents) {
    items.push({
      id: e.id,
      source: e.source as HeatSource,
      zone: e.zoneName,
      text: e.title,
      team: e.team,
      ts: new Date(now - Math.random() * 600000).toISOString(),
    });
  }

  for (const c of cells.filter((x) => x.delta > 2)) {
    items.push({
      id: `surge-${c.id}`,
      source: "curated",
      zone: c.name,
      text: `Heat surge +${c.delta}% · ${c.signals[0]?.text ?? "fan activity"}`,
      team: c.dominantTeam,
      ts: new Date(now - Math.random() * 120000).toISOString(),
    });
  }

  return items
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 12);
}

export function buildHeatmap(teamCode?: string): HeatmapResponse {
  const pulse = jitterPulse(getPulseZones(teamCode));
  const pulseById = Object.fromEntries(pulse.map((p) => [p.id, p]));

  const cells = ZONES.map((z) => {
    const p = pulseById[z.id];
    return scoreZone(z, p?.intensity ?? 50);
  }).sort((a, b) => b.heat - a.heat);

  return {
    updatedAt: new Date().toISOString(),
    sources: countSources(),
    cells,
    feed: buildFeed(cells),
  };
}
