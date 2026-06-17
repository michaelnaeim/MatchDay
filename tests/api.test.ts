import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { GET as getMatches } from "@/app/api/matches/route";
import { GET as getGatherings } from "@/app/api/gatherings/route";
import { POST as postWatchContract } from "@/app/api/watch-contract/route";
import { POST as postRoute } from "@/app/api/route/route";

function get(url: string) {
  return new NextRequest(new URL(url, "http://localhost"));
}
function post(url: string, body: unknown) {
  return new NextRequest(new URL(url, "http://localhost"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const chelsea = { lat: 40.7465, lng: -74.0014 };

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/matches", () => {
  it("returns all matches and the team list", async () => {
    const res = await getMatches(get("/api/matches"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.matches.length).toBeGreaterThan(0);
    expect(data.teams).toContain("FRA");
  });

  it("filters by team", async () => {
    const res = await getMatches(get("/api/matches?team=FRA"));
    const data = await res.json();
    for (const m of data.matches) {
      expect([m.homeTeam, m.awayTeam]).toContain("FRA");
    }
  });

  it("rejects an unknown team", async () => {
    const res = await getMatches(get("/api/matches?team=USA"));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/gatherings", () => {
  it("returns real events and ranked venues", async () => {
    const res = await getGatherings(
      get("/api/gatherings?team=FRA&loc=40.7465,-74.0014&intent=party&lang=French"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.team).toBe("FRA");
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.venues[0].reasons.length).toBeGreaterThan(0);
  });
});

describe("POST /api/watch-contract", () => {
  it("assembles a contract for the French tourist persona", async () => {
    const res = await postWatchContract(
      post("/api/watch-contract", {
        matchId: "m_fra_mex_0616",
        team: "FRA",
        intent: "party",
        fanLocation: chelsea,
        commentaryLanguage: "French",
        avoidTransitHubs: true,
      }),
    );
    expect(res.status).toBe(200);
    const c = await res.json();
    expect(c.primary.venue.id).toBe("v_fr_felix");
    expect(c.primary.confidence).toBe("confirmed");
    expect(c.backup.venue.id).not.toBe(c.primary.venue.id);
    expect(c.transitWarning).toMatch(/Penn Station/);
    expect(c.route).toBeUndefined(); // includeRoute defaults to false
  });

  it("400s on a missing matchId", async () => {
    const res = await postWatchContract(
      post("/api/watch-contract", { team: "FRA", intent: "party", fanLocation: chelsea }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/route", () => {
  it("returns a route, falling back when the router is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const res = await postRoute(
      post("/api/route", {
        from: chelsea,
        to: { lat: 40.8128, lng: -74.0742 }, // MetLife
      }),
    );
    expect(res.status).toBe(200);
    const plan = await res.json();
    expect(plan.distanceKm).toBeGreaterThan(0);
    // MetLife rule attaches a Secaucus/Penn warning.
    expect(plan.warnings.some((w: string) => /Secaucus|Penn/.test(w))).toBe(true);
  });
});
