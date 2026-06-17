import type {
  DiasporaCell,
  FanEvent,
  LatLng,
  Match,
  Team,
  TeamCode,
  Venue,
} from "@/types";
import { withinRadius } from "@/lib/geo";

import teamsSeed from "../../data/teams.json";
import matchesSeed from "../../data/matches.json";
import venuesSeed from "../../data/venues.json";
import diasporaSeed from "../../data/diaspora.json";
import eventsSeed from "../../data/events.json";

// ── Repo interface ───────────────────────────────────────────
// The single seam every layer depends on. Swapping seed JSON for
// Supabase is a one-file change: implement this interface and set
// the factory below.

export interface MatchFilter {
  team?: TeamCode;
  /** ISO date (YYYY-MM-DD) in venue-local terms. */
  date?: string;
}

export interface VenueFilter {
  team?: TeamCode;
  near?: LatLng;
  radiusKm?: number;
}

export interface EventFilter {
  team?: TeamCode;
  matchId?: string;
}

export interface Repo {
  getTeams(): Promise<Team[]>;
  getMatches(filter?: MatchFilter): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  getVenues(filter?: VenueFilter): Promise<Venue[]>;
  /** Live (or seeded) watch-party events. Scoring consumes this. */
  getLiveEvents(filter?: EventFilter): Promise<FanEvent[]>;
  getDiasporaCells(team?: TeamCode): Promise<DiasporaCell[]>;
}

// ── Seed (JSON) implementation — the $0 default ──────────────

const teams = teamsSeed as Team[];
const matches = matchesSeed as Match[];
const venues = venuesSeed as Venue[];
const diaspora = diasporaSeed as DiasporaCell[];
const events = eventsSeed as FanEvent[];

function matchLocalDate(m: Match): string {
  // matches.json carries an explicit offset; take the date portion.
  return m.kickoff.slice(0, 10);
}

export class SeedRepo implements Repo {
  async getTeams(): Promise<Team[]> {
    return teams;
  }

  async getMatches(filter?: MatchFilter): Promise<Match[]> {
    return matches.filter((m) => {
      if (filter?.team && m.homeTeam !== filter.team && m.awayTeam !== filter.team) {
        return false;
      }
      if (filter?.date && matchLocalDate(m) !== filter.date) return false;
      return true;
    });
  }

  async getMatch(id: string): Promise<Match | null> {
    return matches.find((m) => m.id === id) ?? null;
  }

  async getVenues(filter?: VenueFilter): Promise<Venue[]> {
    return venues.filter((v) => {
      if (filter?.team && !v.teams.includes(filter.team)) return false;
      if (filter?.near && filter.radiusKm != null) {
        if (!withinRadius(v.location, filter.near, filter.radiusKm)) return false;
      }
      return true;
    });
  }

  async getLiveEvents(filter?: EventFilter): Promise<FanEvent[]> {
    return events.filter((e) => {
      if (filter?.team && e.team !== filter.team) return false;
      if (filter?.matchId && e.matchId !== filter.matchId) return false;
      return true;
    });
  }

  async getDiasporaCells(team?: TeamCode): Promise<DiasporaCell[]> {
    return diaspora.filter((d) => (team ? d.team === team : true));
  }
}

// ── Factory ──────────────────────────────────────────────────
// Default to seed JSON. When USE_SUPABASE=true and the Supabase repo
// is implemented (Phase 3), swap it in here — nothing else changes.

let cached: Repo | null = null;

export function getRepo(): Repo {
  if (cached) return cached;
  cached = new SeedRepo();
  return cached;
}

/** Test hook: inject a fake repo. */
export function setRepo(repo: Repo): void {
  cached = repo;
}
