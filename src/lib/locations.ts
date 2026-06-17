import type { Intent, LatLng, TeamCode } from "@/types";

// Preset starting points so the demo needs no geocoder. Each maps a
// neighborhood the fan might say ("I'm in Chelsea") to a coordinate.
export interface NamedLocation {
  id: string;
  label: string;
  point: LatLng;
}

export const LOCATIONS: NamedLocation[] = [
  { id: "chelsea", label: "Chelsea, Manhattan", point: { lat: 40.7465, lng: -74.0014 } },
  { id: "midtown", label: "Midtown, Manhattan", point: { lat: 40.7549, lng: -73.984 } },
  { id: "harlem", label: "Harlem", point: { lat: 40.8016, lng: -73.9522 } },
  { id: "jackson-heights", label: "Jackson Heights, Queens", point: { lat: 40.7475, lng: -73.883 } },
  { id: "sunset-park", label: "Sunset Park, Brooklyn", point: { lat: 40.6452, lng: -74.0102 } },
  { id: "ironbound", label: "Ironbound, Newark", point: { lat: 40.732, lng: -74.16 } },
  { id: "secaucus", label: "Secaucus, NJ", point: { lat: 40.7891, lng: -74.0565 } },
];

export function locationById(id: string): NamedLocation | undefined {
  return LOCATIONS.find((l) => l.id === id);
}

// ── The four demo personas ───────────────────────────────────
export interface Persona {
  id: string;
  emoji: string;
  name: string;
  blurb: string;
  team: TeamCode;
  matchId: string;
  locationId: string;
  intent: Intent;
  commentaryLanguage?: string;
  avoidTransitHubs: boolean;
}

export const PERSONAS: Persona[] = [
  {
    id: "french-tourist",
    emoji: "🇫🇷",
    name: "French tourist",
    blurb: "France plays in NJ today. In Chelsea, wants French commentary, hates lines.",
    team: "FRA",
    matchId: "m_fra_mex_0616",
    locationId: "chelsea",
    intent: "party",
    commentaryLanguage: "French",
    avoidTransitHubs: true,
  },
  {
    id: "group-of-four",
    emoji: "🇧🇷",
    name: "Group of 4, mixed needs",
    blurb: "Brazil fans in Midtown — some want the party, some want to actually hear the game.",
    team: "BRA",
    matchId: "m_bra_eng_0616",
    locationId: "midtown",
    intent: "party",
    commentaryLanguage: "Portuguese",
    avoidTransitHubs: false,
  },
  {
    id: "night-shift",
    emoji: "🌙",
    name: "Night-shift worker",
    blurb: "Mexico fan in Sunset Park with little time — needs the closest sure thing.",
    team: "MEX",
    matchId: "m_fra_mex_0616",
    locationId: "sunset-park",
    intent: "survival",
    commentaryLanguage: "Spanish",
    avoidTransitHubs: true,
  },
  {
    id: "local-survival",
    emoji: "⚽",
    name: "Local, survival mode",
    blurb: "England fan in Chelsea, just wants any screen showing the match, fast.",
    team: "ENG",
    matchId: "m_bra_eng_0616",
    locationId: "chelsea",
    intent: "survival",
    avoidTransitHubs: false,
  },
];
