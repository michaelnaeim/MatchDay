import seededEvents from "@/data/live-events.json";
import type { HeatSource } from "./heatmap";
import { ZONE_GEO, zoneFromText } from "./zones";

export interface IngestedEvent {
  id: string;
  source: HeatSource;
  title: string;
  team: string;
  zone: string;
  zoneName: string;
  lat: number;
  lng: number;
  url?: string;
  fetchedAt: string;
}

interface RedditChild {
  data?: { title?: string; selftext?: string; permalink?: string; created_utc?: number };
}

interface EventbriteEvent {
  id?: string;
  name?: { text?: string };
  url?: string;
  venue?: { latitude?: string; longitude?: string; name?: string };
}

const WATCH_KEYWORDS =
  /world\s*cup|watch\s*party|fan\s*zone|screening|les\s*bleus|senegal|football|soccer|match/i;

function seeded(): IngestedEvent[] {
  const now = new Date().toISOString();
  return seededEvents.map((e) => {
    const zone = ZONE_GEO.find((z) => z.id === e.zone) ?? ZONE_GEO[0];
    return {
      id: e.id,
      source: e.source as HeatSource,
      title: e.title,
      team: e.team,
      zone: zone.id,
      zoneName: e.zoneName,
      lat: zone.lat + (Math.random() - 0.5) * 0.008,
      lng: zone.lng + (Math.random() - 0.5) * 0.008,
      url: "url" in e ? (e as { url?: string }).url : undefined,
      fetchedAt: now,
    };
  });
}

async function fetchReddit(): Promise<IngestedEvent[]> {
  const queries = ["world cup watch nyc", "senegal watch party", "french watch party"];
  const out: IngestedEvent[] = [];
  const now = new Date().toISOString();

  for (const q of queries) {
    const url = `https://www.reddit.com/r/nyc/search.json?q=${encodeURIComponent(q)}&restrict_sr=on&sort=new&limit=6`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MatchDay/1.0 (world-cup-planner)" },
      cache: "no-store",
    });
    if (!res.ok) continue;

    const json = (await res.json()) as { data?: { children?: RedditChild[] } };
    for (const child of json.data?.children ?? []) {
      const d = child.data;
      if (!d?.title) continue;
      const text = `${d.title} ${d.selftext ?? ""}`;
      if (!WATCH_KEYWORDS.test(text)) continue;

      const zone = zoneFromText(text) ?? ZONE_GEO[3];
      const team = /senegal|lion|teranga|sadio/i.test(text)
        ? "SEN"
        : /france|french|bleu/i.test(text)
          ? "FRA"
          : zone.team;

      out.push({
        id: `reddit-${d.permalink ?? d.title}`.slice(0, 64),
        source: "reddit",
        title: d.title,
        team,
        zone: zone.id,
        zoneName: zone.name,
        lat: zone.lat + (Math.random() - 0.5) * 0.006,
        lng: zone.lng + (Math.random() - 0.5) * 0.006,
        url: d.permalink ? `https://reddit.com${d.permalink}` : undefined,
        fetchedAt: now,
      });
    }
  }

  return out;
}

async function fetchEventbrite(): Promise<IngestedEvent[]> {
  const token = process.env.EVENTBRITE_TOKEN;
  if (!token) return [];

  const url = new URL("https://www.eventbriteapi.com/v3/events/search/");
  url.searchParams.set("location.latitude", "40.758");
  url.searchParams.set("location.longitude", "-73.985");
  url.searchParams.set("location.within", "50km");
  url.searchParams.set("q", "world cup watch");
  url.searchParams.set("expand", "venue");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const json = (await res.json()) as { events?: EventbriteEvent[] };
  const now = new Date().toISOString();
  const out: IngestedEvent[] = [];

  for (const ev of json.events ?? []) {
    const title = ev.name?.text ?? "Watch party";
    const lat = ev.venue?.latitude ? parseFloat(ev.venue.latitude) : null;
    const lng = ev.venue?.longitude ? parseFloat(ev.venue.longitude) : null;
    const zone =
      zoneFromText(`${title} ${ev.venue?.name ?? ""}`) ??
      (lat && lng
        ? ZONE_GEO.reduce((best, z) => {
            const d = (z.lat - lat) ** 2 + (z.lng - lng) ** 2;
            const bd = (best.lat - lat) ** 2 + (best.lng - lng) ** 2;
            return d < bd ? z : best;
          })
        : ZONE_GEO[0]);

    out.push({
      id: `eb-live-${ev.id}`,
      source: "eventbrite",
      title,
      team: /senegal/i.test(title) ? "SEN" : /france|french|bleu/i.test(title) ? "FRA" : zone.team,
      zone: zone.id,
      zoneName: zone.name,
      lat: lat ?? zone.lat,
      lng: lng ?? zone.lng,
      url: ev.url,
      fetchedAt: now,
    });
  }

  return out;
}

function dedupe(events: IngestedEvent[]): IngestedEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = e.title.toLowerCase().slice(0, 48);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Pull Reddit + Eventbrite when available; always merge seeded fallbacks. */
export async function ingestLiveEvents(): Promise<{
  events: IngestedEvent[];
  liveSources: { reddit: number; eventbrite: number; seeded: number };
}> {
  const [reddit, eventbrite] = await Promise.allSettled([
    fetchReddit(),
    fetchEventbrite(),
  ]);

  const redditEvents = reddit.status === "fulfilled" ? reddit.value : [];
  const ebEvents = eventbrite.status === "fulfilled" ? eventbrite.value : [];
  const base = seeded();

  const merged = dedupe([...ebEvents, ...redditEvents, ...base]);

  return {
    events: merged,
    liveSources: {
      reddit: redditEvents.length,
      eventbrite: ebEvents.length,
      seeded: base.length,
    },
  };
}
