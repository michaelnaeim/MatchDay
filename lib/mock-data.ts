import type {
  GatheringPlace,
  GatheringsFilters,
  GatheringsResponse,
  Match,
  Team,
} from "./types";

export const TEAMS: Team[] = [
  { code: "FRA", name: "France", flag: "🇫🇷", color: "#0055a4" },
  { code: "MEX", name: "Mexico", flag: "🇲🇽", color: "#006847" },
  { code: "BRA", name: "Brazil", flag: "🇧🇷", color: "#009c3b" },
  { code: "USA", name: "United States", flag: "🇺🇸", color: "#3c3b6e" },
  { code: "ARG", name: "Argentina", flag: "🇦🇷", color: "#74acdf" },
];

export const TODAY_MATCH: Match = {
  id: "wc2026-fra-sen",
  home: "FRA",
  away: "SEN",
  kickoff: "2026-06-28T19:00:00-04:00",
  venueName: "MetLife Stadium",
  lat: 40.8135,
  lng: -74.0745,
};

/** Mock NYC/NJ venues — replace via /api/gatherings when backend is live */
export const MOCK_PLACES: GatheringPlace[] = [
  {
    id: "evt-1",
    name: "Les Bleus Watch Party — R32",
    lat: 40.7892,
    lng: -74.0561,
    teamTags: ["FRA"],
    crowdLevel: "high",
    vibe: "party",
    confidence: "confirmed",
    source: "eventbrite",
    sourceUrl: "https://www.eventbrite.com",
    languages: ["fr", "en"],
    neighborhood: "Secaucus, NJ",
    description:
      "Official-style fan gathering near MetLife. French commentary, big screens, expect a line by 6:15pm.",
    arriveBy: "5:50 PM",
    expectedPeak: "6:15 PM",
    adaAccessible: true,
    price: "$$",
    kitchenOpenLate: true,
  },
  {
    id: "evt-2",
    name: "Le Bateau Ivre",
    lat: 40.7734,
    lng: -73.9542,
    teamTags: ["FRA"],
    crowdLevel: "medium",
    vibe: "authentic",
    confidence: "likely",
    source: "curated",
    languages: ["fr", "en"],
    neighborhood: "Yorkville, Manhattan",
    description:
      "Francophone bistro crowd. Same fans, calmer than Secaucus — good French audio and food.",
    arriveBy: "6:00 PM",
    expectedPeak: "6:30 PM",
    adaAccessible: false,
    price: "$$",
    kitchenOpenLate: true,
  },
  {
    id: "evt-3",
    name: "Alliance Française Screening Room",
    lat: 40.7651,
    lng: -73.9682,
    teamTags: ["FRA"],
    crowdLevel: "low",
    vibe: "quiet",
    confidence: "confirmed",
    source: "luma",
    sourceUrl: "https://lu.ma",
    languages: ["fr"],
    neighborhood: "Upper East Side",
    description:
      "Quiet cultural watch — seated, captions available, minimal line. Best if you hate crowds.",
    arriveBy: "6:30 PM",
    expectedPeak: "6:45 PM",
    adaAccessible: true,
    price: "$",
    kitchenOpenLate: false,
  },
  {
    id: "evt-4",
    name: "Meadowlands Sports Bar",
    lat: 40.8055,
    lng: -74.0701,
    teamTags: ["FRA", "neutral"],
    crowdLevel: "high",
    vibe: "party",
    confidence: "likely",
    source: "curated",
    languages: ["en", "fr"],
    neighborhood: "East Rutherford, NJ",
    description:
      "Stadium corridor energy pre-kickoff. Loud, packed, mostly match-day walk-ins.",
    arriveBy: "5:30 PM",
    expectedPeak: "5:45 PM",
    adaAccessible: true,
    price: "$$",
    kitchenOpenLate: true,
  },
  {
    id: "evt-5",
    name: "r/nyc — UES apartment watch",
    lat: 40.7712,
    lng: -73.9598,
    teamTags: ["FRA"],
    crowdLevel: "low",
    vibe: "authentic",
    confidence: "community",
    source: "reddit",
    sourceUrl: "https://reddit.com/r/nyc",
    languages: ["fr", "en"],
    neighborhood: "Yorkville",
    description:
      "Community tip from Reddit today. Small gathering, BYOB — verify before you go.",
    arriveBy: "6:45 PM",
    expectedPeak: "7:00 PM",
    adaAccessible: false,
    price: "$",
    kitchenOpenLate: false,
  },
  {
    id: "evt-6",
    name: "Café du Soleil",
    lat: 40.8012,
    lng: -73.9668,
    teamTags: ["FRA"],
    crowdLevel: "medium",
    vibe: "quiet",
    confidence: "backup",
    source: "curated",
    languages: ["fr", "en"],
    neighborhood: "Morningside Heights",
    description:
      "Backup spot if Yorkville fills up. Patio screens, shorter wait, still francophone.",
    arriveBy: "6:15 PM",
    expectedPeak: "6:45 PM",
    adaAccessible: true,
    price: "$$",
    kitchenOpenLate: false,
  },
  {
    id: "mex-1",
    name: "Mexico House Watch Fiesta",
    lat: 40.7468,
    lng: -73.8642,
    teamTags: ["MEX"],
    crowdLevel: "high",
    vibe: "party",
    confidence: "confirmed",
    source: "luma",
    sourceUrl: "https://lu.ma",
    languages: ["es", "en"],
    neighborhood: "Corona, Queens",
    description: "High-energy Mexico fan zone. Live DJ after match.",
    arriveBy: "6:00 PM",
    expectedPeak: "6:30 PM",
    adaAccessible: true,
    price: "$",
    kitchenOpenLate: true,
  },
  {
    id: "bra-1",
    name: "Samba & Screens",
    lat: 40.7615,
    lng: -73.9256,
    teamTags: ["BRA"],
    crowdLevel: "high",
    vibe: "party",
    confidence: "confirmed",
    source: "eventbrite",
    sourceUrl: "https://www.eventbrite.com",
    languages: ["pt", "en"],
    neighborhood: "Astoria, Queens",
    description: "Brazilian supporters club event. Very loud, very fun.",
    arriveBy: "5:45 PM",
    expectedPeak: "6:15 PM",
    adaAccessible: false,
    price: "$$",
    kitchenOpenLate: true,
  },
];

export function filterPlaces(
  places: GatheringPlace[],
  team: string,
  intent: GatheringsFilters["intent"]
): GatheringPlace[] {
  let filtered = places.filter((p) => p.teamTags.includes(team));

  if (intent === "party") {
    filtered = filtered.filter(
      (p) => p.vibe === "party" || p.crowdLevel === "high"
    );
  } else if (intent === "quiet") {
    filtered = filtered.filter(
      (p) => p.vibe === "quiet" || p.crowdLevel === "low"
    );
  } else if (intent === "authentic") {
    filtered = filtered.filter((p) => p.vibe === "authentic");
  }

  const order = { high: 0, medium: 1, low: 2 };
  return [...filtered].sort(
    (a, b) => order[a.crowdLevel] - order[b.crowdLevel]
  );
}

export function mockGatheringsResponse(
  filters: GatheringsFilters
): GatheringsResponse {
  const places = filterPlaces(MOCK_PLACES, filters.team, filters.intent);
  const match = filters.team === "FRA" ? TODAY_MATCH : null;
  return {
    places,
    match,
    updatedAt: new Date().toISOString(),
  };
}
