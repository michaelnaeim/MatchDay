import { describe, it, expect } from "vitest";
import {
  haversineKm,
  withinRadius,
  distancePointToPolylineKm,
  LANDMARKS,
} from "@/lib/geo";

describe("geo", () => {
  it("computes a sane haversine distance (Penn → MetLife ~8.5km)", () => {
    const km = haversineKm(LANDMARKS.pennStation, LANDMARKS.metlifeStadium);
    expect(km).toBeGreaterThan(7);
    expect(km).toBeLessThan(10);
  });

  it("withinRadius respects the radius boundary", () => {
    expect(withinRadius(LANDMARKS.pennStation, LANDMARKS.portAuthority, 1)).toBe(
      true,
    );
    expect(
      withinRadius(LANDMARKS.pennStation, LANDMARKS.metlifeStadium, 1),
    ).toBe(false);
  });

  it("detects a polyline passing near Penn Station", () => {
    const through = [
      { lat: 40.74, lng: -73.99 },
      LANDMARKS.pennStation,
      { lat: 40.76, lng: -74.0 },
    ];
    const around = [
      { lat: 40.74, lng: -74.05 },
      { lat: 40.78, lng: -74.06 },
    ];
    expect(distancePointToPolylineKm(LANDMARKS.pennStation, through)).toBeLessThan(
      0.1,
    );
    expect(
      distancePointToPolylineKm(LANDMARKS.pennStation, around),
    ).toBeGreaterThan(1);
  });
});
