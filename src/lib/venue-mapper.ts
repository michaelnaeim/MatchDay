import type { GatheringPlace, Match as UIMatch } from "@/lib/types";
import type { ScoredVenue, Match as BackendMatch } from "@/types";

function crowdFromVenue(sv: ScoredVenue): GatheringPlace["crowdLevel"] {
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

function vibeFromVenue(vibes: string[]): GatheringPlace["vibe"] {
  for (const v of vibes) {
    if (v === "party" || v === "authentic" || v === "quiet") return v;
    if (v === "survival") return "quiet";
    if (v === "sports-bar") return "party";
    if (v === "restaurant" || v === "cafe" || v === "family") return "authentic";
  }
  return "authentic";
}

export function scoredVenueToPlace(sv: ScoredVenue): GatheringPlace {
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
    confidence: sv.confidence,
    source: ((): GatheringPlace["source"] => {
      const s = matchedEvent?.source;
      if (s === "eventbrite" || s === "luma" || s === "reddit") return s;
      return "curated";
    })(),
    sourceUrl: matchedEvent?.url,
    languages: venue.showsCommentaryLanguages ?? [],
    neighborhood: venue.neighborhood,
    description,
    arriveBy: matchedEvent?.startTime
      ? new Date(matchedEvent.startTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/New_York",
        })
      : undefined,
    expectedPeak: undefined,
    adaAccessible: venue.tags.some((t) =>
      ["accessible", "ada", "wheelchair"].includes(t.toLowerCase())
    ),
    price: "$$",
    kitchenOpenLate: venue.tags.some((t) =>
      ["late", "late-night", "kitchen-late"].includes(t.toLowerCase())
    ),
  };
}

export function backendMatchToUI(m: BackendMatch): UIMatch {
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
