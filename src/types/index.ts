// ── Domain types ─────────────────────────────────────────────
// The fixed contract every layer (scoring, watch contract, API, UI,
// agent, ingest) depends on. Keep these stable.

export type TeamCode = "FRA" | "SEN" | "BRA" | "ENG" | "MEX";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Team {
  code: TeamCode;
  name: string;
  flag: string; // emoji
  /** Languages the diaspora prefers commentary in, most-preferred first. */
  commentaryLanguages: string[];
}

export interface Match {
  id: string;
  homeTeam: TeamCode;
  awayTeam: TeamCode | string;
  venueName: string; // e.g. "MetLife Stadium"
  venue: LatLng;
  kickoff: string; // ISO 8601
  stage: string; // "Group Stage", "Round of 32", ...
  city: string;
}

/** The four fan intents that steer scoring. */
export type Intent = "party" | "quiet" | "authentic" | "survival";

export type VenueVibe =
  | "party"
  | "quiet"
  | "authentic"
  | "survival"
  | "sports-bar"
  | "restaurant"
  | "cafe"
  | "family";

export interface Venue {
  id: string;
  name: string;
  location: LatLng;
  address: string;
  neighborhood: string;
  /** Free-form descriptive tags, e.g. ["french","loud","big-screens"]. */
  tags: string[];
  /** Diaspora teams this venue is affiliated with. */
  teams: TeamCode[];
  vibe: VenueVibe[];
  /** Languages this venue is known to show commentary in. */
  showsCommentaryLanguages: string[];
  capacityHint?: "small" | "medium" | "large";
  hasOutdoorSeating?: boolean;
}

// ── Confidence: honest, source-ranked ────────────────────────
// confirmed > community > likely > backup. Never upgrade beyond
// what the source justifies.
export type ConfidenceLevel = "confirmed" | "community" | "likely" | "backup";

export const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  confirmed: 3,
  community: 2,
  likely: 1,
  backup: 0,
};

export type EventSource =
  | "eventbrite"
  | "luma"
  | "reddit"
  | "seed"
  | "manual";

/** A live (or seeded) watch-party event. Only ever real/ingested. */
export interface FanEvent {
  id: string;
  title: string;
  venueId?: string;
  venueName: string;
  location: LatLng;
  team: TeamCode;
  matchId?: string;
  startTime: string; // ISO 8601
  source: EventSource;
  url?: string;
  confidence: ConfidenceLevel;
  commentaryLanguage?: string;
  tags: string[];
  ingestedAt: string; // ISO 8601
}

/** Diaspora geography: density cells used to infer good neighborhoods. */
export interface DiasporaCell {
  id: string;
  team: TeamCode;
  neighborhood: string;
  center: LatLng;
  /** Relative diaspora density, 0..1. */
  density: number;
  radiusKm: number;
}

// ── Scoring outputs ──────────────────────────────────────────
export type RecommendationSource =
  | "live-event"
  | "tagged-venue"
  | "diaspora-inferred";

export interface ScoreReason {
  factor: string; // "diaspora", "intent", "commentary", "distance", "live-event", "transit"
  detail: string; // human-readable explanation
  delta: number; // signed contribution to the score
}

export interface ScoredVenue {
  venue: Venue;
  score: number;
  reasons: ScoreReason[];
  confidence: ConfidenceLevel;
  source: RecommendationSource;
  matchedEvent?: FanEvent;
  distanceKm: number;
}

// ── Routing ──────────────────────────────────────────────────
export type TravelMode = "transit" | "driving" | "walking";

export interface RoutePlan {
  from: LatLng;
  to: LatLng;
  distanceKm: number;
  durationMin: number;
  geometry: LatLng[]; // ordered polyline points
  warnings: string[];
  mode: TravelMode;
}

// ── Watch Contract ───────────────────────────────────────────
export interface WatchContractRequest {
  matchId: string;
  fanLocation: LatLng;
  team: TeamCode;
  intent: Intent;
  /** Preferred commentary language, e.g. "French". */
  commentaryLanguage?: string;
  /** "hate lines" → avoid transit chokepoints / long queues. */
  avoidTransitHubs?: boolean;
}

export interface WatchContract {
  match: Match;
  team: TeamCode;
  intent: Intent;
  primary: ScoredVenue;
  /** A deliberately contrasting backup (e.g. party ⇄ quiet). */
  backup: ScoredVenue;
  arriveBy: string; // ISO 8601 = kickoff − 45 min
  transitWarning?: string;
  route?: RoutePlan;
  generatedAt: string; // ISO 8601
}
