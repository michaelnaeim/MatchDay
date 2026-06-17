import type {
  Match,
  RoutePlan,
  ScoredVenue,
  WatchContract,
  WatchContractRequest,
} from "@/types";
import type { Repo } from "@/services/repo";
import {
  contrastIntent,
  scoreVenues,
  type ScoreContext,
} from "@/services/scoring_service";
import { haversineKm, LANDMARKS } from "@/lib/geo";

const ARRIVE_BUFFER_MIN = 45;

/** kickoff − 45 min, as an ISO string. */
export function arriveByFor(kickoffIso: string): string {
  const kickoff = new Date(kickoffIso);
  return new Date(kickoff.getTime() - ARRIVE_BUFFER_MIN * 60_000).toISOString();
}

/**
 * Transit warning for the match. The MetLife rule: Penn Station is the
 * default but worst chokepoint on match day; Secaucus Junction is the
 * pressure valve. Surfaced here and reinforced by the routing layer.
 */
export function transitWarningFor(match: Match): string | undefined {
  const atMetLife =
    haversineKm(match.venue, LANDMARKS.metlifeStadium) < 1.5;
  if (atMetLife) {
    return (
      "MetLife on match day: NJ Transit funnels everyone through Penn Station → " +
      "expect long lines. Go via Secaucus Junction and build in extra time."
    );
  }
  return undefined;
}

/** Pick a contrasting backup: opposite vibe axis, different venue. */
function pickBackup(
  ranked: ScoredVenue[],
  primary: ScoredVenue,
  intent: WatchContractRequest["intent"],
): ScoredVenue {
  const opposite = contrastIntent(intent);
  const contrasting = ranked.find(
    (sv) =>
      sv.venue.id !== primary.venue.id && sv.venue.vibe.includes(opposite),
  );
  if (contrasting) return contrasting;
  // Fall back to the next best distinct venue.
  const next = ranked.find((sv) => sv.venue.id !== primary.venue.id);
  return next ?? primary;
}

export interface AssembleOptions {
  /** Optional precomputed route (Phase 4 wires this through /api/route). */
  route?: RoutePlan;
}

/**
 * Assemble the Watch Contract end-to-end:
 *   primary + contrasting backup + arrive-by + transit warning (+ route).
 * Every recommendation traces back to a scored, real candidate.
 */
export async function assembleWatchContract(
  req: WatchContractRequest,
  repo: Repo,
  opts: AssembleOptions = {},
): Promise<WatchContract> {
  const match = await repo.getMatch(req.matchId);
  if (!match) {
    throw new Error(`Match not found: ${req.matchId}`);
  }

  const [venues, events, diaspora] = await Promise.all([
    repo.getVenues({ team: req.team }),
    repo.getLiveEvents({ team: req.team, matchId: req.matchId }),
    repo.getDiasporaCells(req.team),
  ]);

  if (venues.length === 0) {
    throw new Error(`No candidate venues for team ${req.team}`);
  }

  const ctx: ScoreContext = {
    fanLocation: req.fanLocation,
    intent: req.intent,
    commentaryLanguage: req.commentaryLanguage,
    avoidTransitHubs: req.avoidTransitHubs,
    events,
    diaspora,
  };

  const ranked = scoreVenues(venues, ctx);
  const primary = ranked[0];
  const backup = pickBackup(ranked, primary, req.intent);

  return {
    match,
    team: req.team,
    intent: req.intent,
    primary,
    backup,
    arriveBy: arriveByFor(match.kickoff),
    transitWarning: transitWarningFor(match),
    route: opts.route,
    generatedAt: new Date().toISOString(),
  };
}
