import type {
  FanEvent,
  Intent,
  LatLng,
  Match,
  ScoredVenue,
  TeamCode,
  WatchContract,
} from "@/types";

// Thin typed wrappers over the API routes, used by React Query hooks.

export interface MatchesResponse {
  matches: Match[];
  teams: TeamCode[];
}

export interface GatheringsResponse {
  team: TeamCode;
  events: FanEvent[];
  venues: ScoredVenue[];
  lastUpdated: string | null;
}

export interface WatchContractInput {
  matchId: string;
  team: TeamCode;
  intent: Intent;
  fanLocation: LatLng;
  commentaryLanguage?: string;
  avoidTransitHubs?: boolean;
  includeRoute?: boolean;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as T;
}

export async function fetchMatches(team?: TeamCode): Promise<MatchesResponse> {
  const q = team ? `?team=${team}` : "";
  return jsonOrThrow(await fetch(`/api/matches${q}`));
}

export async function fetchGatherings(args: {
  team: TeamCode;
  matchId?: string;
  loc?: LatLng;
  intent?: Intent;
  lang?: string;
  avoidHubs?: boolean;
}): Promise<GatheringsResponse> {
  const p = new URLSearchParams({ team: args.team });
  if (args.matchId) p.set("matchId", args.matchId);
  if (args.loc) p.set("loc", `${args.loc.lat},${args.loc.lng}`);
  if (args.intent) p.set("intent", args.intent);
  if (args.lang) p.set("lang", args.lang);
  if (args.avoidHubs) p.set("avoidHubs", "true");
  return jsonOrThrow(await fetch(`/api/gatherings?${p.toString()}`));
}

export async function postWatchContract(
  input: WatchContractInput,
): Promise<WatchContract> {
  return jsonOrThrow(
    await fetch("/api/watch-contract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ includeRoute: true, ...input }),
    }),
  );
}
