import type {
  ConfidenceLevel,
  DiasporaCell,
  FanEvent,
  Intent,
  LatLng,
  RecommendationSource,
  ScoredVenue,
  ScoreReason,
  Venue,
} from "@/types";
import { haversineKm, withinRadius, LANDMARKS } from "@/lib/geo";

// ── Scoring engine ───────────────────────────────────────────
// Transparent and deterministic. Every point added or removed is
// recorded in reasons[], so the UI and agent can show *why* a venue
// was chosen. Nothing here invents a venue or event — it only ranks
// the candidates handed to it by the Repo.

export interface ScoreContext {
  fanLocation: LatLng;
  intent: Intent;
  /** Preferred commentary language, e.g. "French". */
  commentaryLanguage?: string;
  /** "hate lines" → penalize transit chokepoints and cross-river hops. */
  avoidTransitHubs?: boolean;
  /** Live events for this team/match (from repo.getLiveEvents). */
  events: FanEvent[];
  /** Diaspora cells for this team (from repo.getDiasporaCells). */
  diaspora: DiasporaCell[];
}

// Weights — kept as named constants so the engine reads like a rubric.
const W = {
  eventConfirmed: 40,
  eventCommunity: 25,
  eventLikely: 15,
  intentPrimaryVibe: 30,
  intentSecondaryVibe: 8,
  commentary: 20,
  diasporaMax: 25,
  distancePerKm: -1.6,
  distancePerKmSurvival: -3.2,
  survivalNearTransit: 14,
  partyLargeCapacity: 6,
  quietLargeCapacity: -6,
  transitPennPenalty: -12,
  transitCrossRiverPenalty: -10,
} as const;

const EVENT_WEIGHT: Record<ConfidenceLevel, number> = {
  confirmed: W.eventConfirmed,
  community: W.eventCommunity,
  likely: W.eventLikely,
  backup: 0,
};

/** Canonical contrast axis used to pick a contrasting backup venue. */
export function contrastIntent(intent: Intent): Intent {
  switch (intent) {
    case "party":
      return "quiet";
    case "quiet":
      return "party";
    case "authentic":
      return "survival";
    case "survival":
      return "authentic";
  }
}

function maxDiasporaDensity(
  location: LatLng,
  diaspora: DiasporaCell[],
): { density: number; neighborhood: string } | null {
  let best: { density: number; neighborhood: string } | null = null;
  for (const cell of diaspora) {
    if (withinRadius(location, cell.center, cell.radiusKm)) {
      if (!best || cell.density > best.density) {
        best = { density: cell.density, neighborhood: cell.neighborhood };
      }
    }
  }
  return best;
}

function bestEventForVenue(venue: Venue, events: FanEvent[]): FanEvent | undefined {
  const matches = events.filter(
    (e) => e.venueId === venue.id || e.venueName === venue.name,
  );
  if (matches.length === 0) return undefined;
  // Prefer the highest-confidence event.
  const rank: Record<ConfidenceLevel, number> = {
    confirmed: 3,
    community: 2,
    likely: 1,
    backup: 0,
  };
  return matches.sort((a, b) => rank[b.confidence] - rank[a.confidence])[0];
}

/** Score a single venue, returning a fully-explained ScoredVenue. */
export function scoreVenue(venue: Venue, ctx: ScoreContext): ScoredVenue {
  const reasons: ScoreReason[] = [];
  let score = 0;

  const add = (factor: string, detail: string, delta: number) => {
    if (delta === 0) return;
    score += delta;
    reasons.push({ factor, detail, delta: Math.round(delta * 10) / 10 });
  };

  // 1. Live event — the only thing that can lift confidence above "likely".
  const event = bestEventForVenue(venue, ctx.events);
  let source: RecommendationSource;
  let confidence: ConfidenceLevel;
  if (event) {
    source = "live-event";
    confidence = event.confidence;
    add(
      "live-event",
      `Confirmed watch party: "${event.title}" (${event.source})`,
      EVENT_WEIGHT[event.confidence],
    );
  } else if (venue.tags.includes("any-team")) {
    source = "tagged-venue";
    confidence = "likely";
  } else {
    source = "tagged-venue";
    confidence = "likely";
  }

  // 2. Intent ⇄ vibe match.
  if (venue.vibe.includes(ctx.intent)) {
    add("intent", `Vibe matches "${ctx.intent}"`, W.intentPrimaryVibe);
  } else {
    // Reward adjacent vibes lightly (e.g. sports-bar for party).
    const adjacent: Record<Intent, string[]> = {
      party: ["sports-bar"],
      quiet: ["cafe", "restaurant"],
      authentic: ["restaurant", "family"],
      survival: ["sports-bar"],
    };
    if (venue.vibe.some((v) => adjacent[ctx.intent].includes(v))) {
      add("intent", `Adjacent vibe for "${ctx.intent}"`, W.intentSecondaryVibe);
    }
  }

  // 3. Commentary language.
  if (
    ctx.commentaryLanguage &&
    venue.showsCommentaryLanguages.includes(ctx.commentaryLanguage)
  ) {
    add("commentary", `Shows ${ctx.commentaryLanguage} commentary`, W.commentary);
  }

  // 4. Diaspora density at the venue's location.
  const diaspora = maxDiasporaDensity(venue.location, ctx.diaspora);
  if (diaspora) {
    add(
      "diaspora",
      `In ${diaspora.neighborhood} (diaspora density ${Math.round(diaspora.density * 100)}%)`,
      W.diasporaMax * diaspora.density,
    );
  }

  // 5. Distance from the fan.
  const distanceKm = haversineKm(ctx.fanLocation, venue.location);
  const perKm =
    ctx.intent === "survival" ? W.distancePerKmSurvival : W.distancePerKm;
  add(
    "distance",
    `${distanceKm.toFixed(1)} km from you`,
    perKm * distanceKm,
  );

  // 6. Survival convenience / capacity nuance.
  if (ctx.intent === "survival" && venue.tags.includes("near-transit")) {
    add("convenience", "Right by transit (survival mode)", W.survivalNearTransit);
  }
  if (ctx.intent === "party" && venue.capacityHint === "large") {
    add("capacity", "Large venue for a crowd", W.partyLargeCapacity);
  }
  if (ctx.intent === "quiet" && venue.capacityHint === "large") {
    add("capacity", "Large/loud venue (counts against quiet)", W.quietLargeCapacity);
  }

  // 7. Transit aversion ("hate lines").
  if (ctx.avoidTransitHubs) {
    if (withinRadius(venue.location, LANDMARKS.pennStation, 0.6)) {
      add("transit", "Right on top of Penn Station crowds", W.transitPennPenalty);
    }
    // West of the Hudson → usually a NJ Transit / PATH hop through a hub.
    if (venue.location.lng < -74.05) {
      add(
        "transit",
        "Across the river — likely a transfer through a transit hub",
        W.transitCrossRiverPenalty,
      );
    }
  }

  return {
    venue,
    score: Math.round(score * 10) / 10,
    reasons,
    confidence,
    source,
    matchedEvent: event,
    distanceKm: Math.round(distanceKm * 100) / 100,
  };
}

/** Score and rank all candidate venues, highest first. */
export function scoreVenues(
  venues: Venue[],
  ctx: ScoreContext,
): ScoredVenue[] {
  return venues
    .map((v) => scoreVenue(v, ctx))
    .sort((a, b) => b.score - a.score);
}
