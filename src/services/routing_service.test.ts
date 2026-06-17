import { describe, it, expect } from "vitest";
import { applyMetLifeTransitRule, planRoute } from "@/services/routing_service";
import { LANDMARKS } from "@/lib/geo";
import type { RoutePlan } from "@/types";

const metlife = LANDMARKS.metlifeStadium;

function basePlan(geometry: RoutePlan["geometry"]): RoutePlan {
  return {
    from: { lat: 40.7465, lng: -74.0014 },
    to: metlife,
    distanceKm: 12,
    durationMin: 30,
    geometry,
    warnings: [],
    mode: "transit",
  };
}

describe("routing — MetLife/Penn rule", () => {
  it("penalizes and warns when the route threads through Penn Station", () => {
    const plan = basePlan([
      { lat: 40.7465, lng: -74.0014 },
      LANDMARKS.pennStation,
      metlife,
    ]);
    const ruled = applyMetLifeTransitRule(plan);
    expect(ruled.warnings.some((w) => /Penn Station/.test(w))).toBe(true);
    expect(ruled.durationMin).toBeGreaterThan(plan.durationMin); // time penalty
  });

  it("still nudges toward Secaucus when not passing through Penn", () => {
    const plan = basePlan([
      { lat: 40.78, lng: -74.05 },
      { lat: 40.79, lng: -74.06 },
      metlife,
    ]);
    const ruled = applyMetLifeTransitRule(plan);
    expect(ruled.warnings.some((w) => /Secaucus/.test(w))).toBe(true);
    expect(ruled.durationMin).toBe(plan.durationMin); // no penalty
  });

  it("leaves non-MetLife routes untouched", () => {
    const plan: RoutePlan = {
      ...basePlan([
        { lat: 40.74, lng: -73.99 },
        { lat: 40.72, lng: -74.0 },
      ]),
      to: { lat: 40.72, lng: -74.0 },
    };
    const ruled = applyMetLifeTransitRule(plan);
    expect(ruled.warnings.length).toBe(0);
  });

  it("falls back to a straight-line estimate when the router fails", async () => {
    const failingFetch = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const plan = await planRoute(
      { from: { lat: 40.7465, lng: -74.0014 }, to: metlife },
      failingFetch,
    );
    expect(plan.geometry.length).toBeGreaterThanOrEqual(2);
    expect(plan.distanceKm).toBeGreaterThan(0);
    // MetLife rule still applies on the fallback.
    expect(plan.warnings.some((w) => /Secaucus|Penn/.test(w))).toBe(true);
  });
});
