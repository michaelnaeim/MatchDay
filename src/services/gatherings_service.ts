import type {
  FanEvent,
  Intent,
  LatLng,
  ScoredVenue,
  TeamCode,
} from "@/types";
import type { Repo } from "@/services/repo";
import { scoreVenues, type ScoreContext } from "@/services/scoring_service";

// ── Gatherings service ───────────────────────────────────────
// "Where are my people watching?" A lighter query than the full Watch
// Contract: real live events for the team plus ranked candidate venues.
// Used by GET /api/gatherings and the agent's find_fan_gatherings tool.

export interface GatheringsRequest {
  team: TeamCode;
  matchId?: string;
  fanLocation?: LatLng;
  intent?: Intent;
  commentaryLanguage?: string;
  avoidTransitHubs?: boolean;
}

export interface GatheringsResult {
  team: TeamCode;
  /** Real ingested/seeded events only — never invented. */
  events: FanEvent[];
  /** Ranked candidate venues with transparent reasons. */
  venues: ScoredVenue[];
  /** Most recent ingestedAt across events, for "updated X min ago". */
  lastUpdated: string | null;
}

// A neutral reference point (Midtown) when the fan gives no location.
const DEFAULT_LOCATION: LatLng = { lat: 40.7549, lng: -73.984 };

export async function findFanGatherings(
  req: GatheringsRequest,
  repo: Repo,
): Promise<GatheringsResult> {
  const [venues, events, diaspora] = await Promise.all([
    repo.getVenues({ team: req.team }),
    repo.getLiveEvents({ team: req.team, matchId: req.matchId }),
    repo.getDiasporaCells(req.team),
  ]);

  const ctx: ScoreContext = {
    fanLocation: req.fanLocation ?? DEFAULT_LOCATION,
    intent: req.intent ?? "authentic",
    commentaryLanguage: req.commentaryLanguage,
    avoidTransitHubs: req.avoidTransitHubs,
    events,
    diaspora,
  };

  const ranked = scoreVenues(venues, ctx);

  const lastUpdated =
    events.length > 0
      ? events
          .map((e) => e.ingestedAt)
          .sort()
          .at(-1)!
      : null;

  return { team: req.team, events, venues: ranked, lastUpdated };
}
