export type CrowdLevel = "high" | "medium" | "low";
export type VibeIntent = "party" | "authentic" | "quiet" | "all";
export type Confidence = "confirmed" | "likely" | "community" | "backup";
export type EventSource =
  | "eventbrite"
  | "luma"
  | "ics"
  | "reddit"
  | "curated";

export interface Team {
  code: string;
  name: string;
  flag: string;
  color: string;
}

export interface Match {
  id: string;
  home: string;
  away: string;
  kickoff: string;
  venueName: string;
  lat: number;
  lng: number;
}

export interface GatheringPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  teamTags: string[];
  crowdLevel: CrowdLevel;
  vibe: "party" | "authentic" | "quiet";
  confidence: Confidence;
  source: EventSource;
  sourceUrl?: string;
  languages: string[];
  neighborhood: string;
  description: string;
  arriveBy?: string;
  expectedPeak?: string;
  adaAccessible: boolean;
  price: "$" | "$$" | "$$$";
  kitchenOpenLate: boolean;
}

export interface GatheringsFilters {
  team: string;
  intent: VibeIntent;
  matchId?: string;
  lat: number;
  lng: number;
}

export interface GatheringsResponse {
  places: GatheringPlace[];
  match: Match | null;
  updatedAt: string;
}
