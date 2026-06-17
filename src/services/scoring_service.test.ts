import { describe, it, expect } from "vitest";
import { scoreVenue, scoreVenues, contrastIntent } from "@/services/scoring_service";
import type { DiasporaCell, FanEvent, Venue } from "@/types";

const felix: Venue = {
  id: "v_fr_felix",
  name: "Felix",
  location: { lat: 40.7232, lng: -74.0029 },
  address: "340 W Broadway",
  neighborhood: "SoHo",
  tags: ["french", "loud", "big-screens"],
  teams: ["FRA"],
  vibe: ["party", "restaurant"],
  showsCommentaryLanguages: ["French"],
  capacityHint: "large",
};

const buvette: Venue = {
  id: "v_fr_buvette",
  name: "Buvette",
  location: { lat: 40.7339, lng: -74.0049 },
  address: "42 Grove St",
  neighborhood: "West Village",
  tags: ["french", "intimate"],
  teams: ["FRA"],
  vibe: ["quiet", "cafe", "authentic"],
  showsCommentaryLanguages: ["French"],
  capacityHint: "small",
};

const diaspora: DiasporaCell[] = [
  {
    id: "d_fra",
    team: "FRA",
    neighborhood: "West Village / SoHo",
    center: { lat: 40.7285, lng: -74.0035 },
    density: 0.6,
    radiusKm: 2.0,
  },
];

const confirmedEvent: FanEvent = {
  id: "ev",
  title: "France watch party",
  venueId: "v_fr_felix",
  venueName: "Felix",
  location: felix.location,
  team: "FRA",
  matchId: "m",
  startTime: "2026-06-16T15:30:00-04:00",
  source: "seed",
  confidence: "confirmed",
  commentaryLanguage: "French",
  tags: [],
  ingestedAt: "2026-06-15T12:00:00-04:00",
};

const fanInChelsea = { lat: 40.7465, lng: -74.0014 };

describe("scoring engine", () => {
  it("every point is explained in reasons[]", () => {
    const scored = scoreVenue(felix, {
      fanLocation: fanInChelsea,
      intent: "party",
      commentaryLanguage: "French",
      events: [confirmedEvent],
      diaspora,
    });
    const sum = scored.reasons.reduce((acc, r) => acc + r.delta, 0);
    // reasons sum to the score (within rounding).
    expect(Math.abs(sum - scored.score)).toBeLessThan(1.0);
    expect(scored.reasons.length).toBeGreaterThan(0);
  });

  it("a confirmed live event upgrades confidence and source", () => {
    const scored = scoreVenue(felix, {
      fanLocation: fanInChelsea,
      intent: "party",
      events: [confirmedEvent],
      diaspora,
    });
    expect(scored.confidence).toBe("confirmed");
    expect(scored.source).toBe("live-event");
    expect(scored.matchedEvent?.id).toBe("ev");
  });

  it("without an event, confidence is at most 'likely'", () => {
    const scored = scoreVenue(buvette, {
      fanLocation: fanInChelsea,
      intent: "quiet",
      events: [],
      diaspora,
    });
    expect(scored.confidence).toBe("likely");
    expect(scored.source).toBe("tagged-venue");
  });

  it("intent steers ranking: party picks Felix, quiet picks Buvette", () => {
    const party = scoreVenues([felix, buvette], {
      fanLocation: fanInChelsea,
      intent: "party",
      events: [],
      diaspora,
    });
    expect(party[0].venue.id).toBe("v_fr_felix");

    const quiet = scoreVenues([felix, buvette], {
      fanLocation: fanInChelsea,
      intent: "quiet",
      events: [],
      diaspora,
    });
    expect(quiet[0].venue.id).toBe("v_fr_buvette");
  });

  it("contrastIntent flips along the loud/calm axis", () => {
    expect(contrastIntent("party")).toBe("quiet");
    expect(contrastIntent("quiet")).toBe("party");
  });
});
