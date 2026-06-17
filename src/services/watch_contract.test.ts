import { describe, it, expect } from "vitest";
import {
  assembleWatchContract,
  arriveByFor,
  transitWarningFor,
} from "@/services/watch_contract";
import { SeedRepo } from "@/services/repo";
import type { Match } from "@/types";

const repo = new SeedRepo();
const fanInChelsea = { lat: 40.7465, lng: -74.0014 };

describe("watch contract", () => {
  it("arrive-by is exactly kickoff − 45 min", () => {
    const arrive = arriveByFor("2026-06-16T16:00:00-04:00");
    expect(new Date(arrive).toISOString()).toBe("2026-06-16T19:15:00.000Z");
  });

  it("a MetLife match always carries a Penn Station transit warning", () => {
    const m = {
      venue: { lat: 40.8128, lng: -74.0742 },
    } as Match;
    expect(transitWarningFor(m)).toMatch(/Penn Station/);
  });

  it("French tourist persona: French commentary + party → confirmed primary", async () => {
    const contract = await assembleWatchContract(
      {
        matchId: "m_fra_mex_0616",
        fanLocation: fanInChelsea,
        team: "FRA",
        intent: "party",
        commentaryLanguage: "French",
        avoidTransitHubs: true,
      },
      repo,
    );
    // Felix has the confirmed French watch party.
    expect(contract.primary.venue.id).toBe("v_fr_felix");
    expect(contract.primary.confidence).toBe("confirmed");
    // Backup contrasts (quiet) and is a different venue.
    expect(contract.backup.venue.id).not.toBe(contract.primary.venue.id);
    expect(contract.transitWarning).toMatch(/Penn Station/);
    expect(contract.arriveBy).toBe("2026-06-16T19:15:00.000Z");
  });

  it("never invents a venue — all recommendations come from the repo", async () => {
    const contract = await assembleWatchContract(
      {
        matchId: "m_fra_mex_0616",
        fanLocation: fanInChelsea,
        team: "FRA",
        intent: "quiet",
      },
      repo,
    );
    const venues = await repo.getVenues({ team: "FRA" });
    const ids = new Set(venues.map((v) => v.id));
    expect(ids.has(contract.primary.venue.id)).toBe(true);
    expect(ids.has(contract.backup.venue.id)).toBe(true);
  });
});
