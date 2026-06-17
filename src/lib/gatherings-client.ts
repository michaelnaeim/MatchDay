import type {
  GatheringPlace,
  GatheringsFilters,
  GatheringsResponse,
  Match as UIMatch,
  Confidence,
  CrowdLevel,
  EventSource as UISource,
  VibeIntent,
} from "./types";
import { mockGatheringsResponse } from "./mock-data";
import type {
  ScoredVenue,
  Match as BackendMatch,
  VenueVibe,
  EventSource as BackendSource,
  Intent,
} from "@/types";

// ── Real backend ⇄ premium UI adapter ────────────────────────
// The UI is built around a flat { places, match, updatedAt } shape, while the
// backend exposes ranked ScoredVenue[] (with reasons/scoring) and a richer
// Match. This module is the single seam that maps one onto the other so the
// premium UI is powered by the real scoring engine — falling back to mock data
// only if the backend is unreachable (keeps local dev resilient).

interface BackendGatherings {
  team: string;
  events: unknown[];
  venues: ScoredVenue[];
  lastUpdated: string | null;
}

interface BackendMatchesResponse {
  matches: BackendMatch[];
  teams: string[];
}

/** UI VibeIntent → backend Intent. "all" has no backend analogue → omit. */
function toBackendIntent(intent: VibeIntent): Intent | undefined {
  if (intent === "party" || intent === "quiet" || intent === "authentic") {
    return intent;
  }
  return undefined;
}

function crowdFromVenue(sv: ScoredVenue): CrowdLevel {
  switch (sv.venue.capacityHint) {
    case "large":
      return "high";
    case "medium":
      return "medium";
    case "small":
      return "low";
    default:
      return sv.score >= 70 ? "high" : sv.score >= 40 ? "medium" : "low";
  }
}

function vibeFromVenue(vibes: VenueVibe[]): GatheringPlace["vibe"] {
  for (const v of vibes) {
    if (v === "party" || v === "authentic" || v === "quiet") return v;
    if (v === "survival") return "quiet";
    if (v === "sports-bar") return "party";
    if (v === "restaurant" || v === "cafe" || v === "family") return "authentic";
  }
  return "authentic";
}

function sourceFromEvent(source?: BackendSource): UISource {
  switch (source) {
    case "eventbrite":
      return "eventbrite";
    case "luma":
      return "luma";
    case "reddit":
      return "reddit";
    default:
      return "curated";
  }
}

function timeLabel(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function hasTag(tags: string[], ...needles: string[]): boolean {
  const lower = tags.map((t) => t.toLowerCase());
  return needles.some((n) => lower.includes(n));
}

function scoredVenueToPlace(sv: ScoredVenue): GatheringPlace {
  const { venue, matchedEvent } = sv;
  const description =
    matchedEvent?.title ??
    sv.reasons[0]?.detail ??
    `${venue.vibe[0] ?? "Watch spot"} in ${venue.neighborhood}`;

  return {
    id: venue.id,
    name: venue.name,
    lat: venue.location.lat,
    lng: venue.location.lng,
    teamTags: venue.teams,
    crowdLevel: crowdFromVenue(sv),
    vibe: vibeFromVenue(venue.vibe),
    confidence: sv.confidence as Confidence,
    source: sourceFromEvent(matchedEvent?.source),
    sourceUrl: matchedEvent?.url,
    languages: venue.showsCommentaryLanguages ?? [],
    neighborhood: venue.neighborhood,
    description,
    arriveBy: timeLabel(matchedEvent?.startTime),
    expectedPeak: undefined,
    adaAccessible: hasTag(venue.tags, "accessible", "ada", "wheelchair"),
    price: "$$",
    kitchenOpenLate: hasTag(venue.tags, "late", "late-night", "kitchen-late"),
  };
}

function backendMatchToUI(m: BackendMatch): UIMatch {
  return {
    id: m.id,
    home: m.homeTeam,
    away: typeof m.awayTeam === "string" ? m.awayTeam : String(m.awayTeam),
    kickoff: m.kickoff,
    venueName: m.venueName,
    lat: m.venue.lat,
    lng: m.venue.lng,
  };
}

/** Pick the soonest upcoming match for the team, else the first available. */
function pickMatch(matches: BackendMatch[]): UIMatch | null {
  if (!matches.length) return null;
  const now = Date.now();
  const upcoming = matches
    .filter((m) => new Date(m.kickoff).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    );
  return backendMatchToUI(upcoming[0] ?? matches[0]);
}

/**
 * Calls the real backend gatherings + matches routes and adapts them to the
 * UI shape. Falls back to mock data only when the backend is unreachable.
 */
export async function fetchGatherings(
  filters: GatheringsFilters,
): Promise<GatheringsResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";

  const gatheringsParams = new URLSearchParams({
    team: filters.team,
    loc: `${filters.lat},${filters.lng}`,
  });
  if (filters.matchId) gatheringsParams.set("matchId", filters.matchId);
  const intent = toBackendIntent(filters.intent);
  if (intent) gatheringsParams.set("intent", intent);

  try {
    const [gRes, mRes] = await Promise.all([
      fetch(`${base}/api/gatherings?${gatheringsParams}`),
      fetch(`${base}/api/matches?team=${filters.team}`),
    ]);
    if (!gRes.ok) throw new Error(`gatherings ${gRes.status}`);

    const gdata = (await gRes.json()) as BackendGatherings;
    const places = gdata.venues.map(scoredVenueToPlace);

    let match: UIMatch | null = null;
    if (mRes.ok) {
      const mData = (await mRes.json()) as BackendMatchesResponse;
      match = pickMatch(mData.matches);
    }

    return {
      places,
      match,
      updatedAt: gdata.lastUpdated ?? new Date().toISOString(),
    };
  } catch {
    return mockGatheringsResponse(filters);
  }
}

/**
 * Live ingest freshness — served by the live-map route in this build.
 */
export async function fetchLiveEvents(
  team: string,
): Promise<{ updatedAt: string }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  try {
    const res = await fetch(`${base}/api/live-map?team=${team}`);
    if (!res.ok) throw new Error("API error");
    const data = (await res.json()) as { updatedAt?: string };
    return { updatedAt: data.updatedAt ?? new Date().toISOString() };
  } catch {
    return { updatedAt: new Date().toISOString() };
  }
}
