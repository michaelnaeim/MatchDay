import type { LatLng, RoutePlan, TravelMode } from "@/types";
import {
  haversineKm,
  distancePointToPolylineKm,
  LANDMARKS,
} from "@/lib/geo";

// ── Routing service ──────────────────────────────────────────
// Wraps a free-tier router (OSRM public demo by default; OpenRouteService
// if a key is set) behind one function. Always degrades to a straight-line
// estimate so the demo never hard-fails. The MetLife/Penn rule lives here.

export interface RouteRequest {
  from: LatLng;
  to: LatLng;
  mode?: TravelMode;
}

const AVG_TRANSIT_KMH = 24; // metro door-to-door rough average
const PENN_PROXIMITY_KM = 0.5; // how close a route must pass to "go through" Penn

/**
 * Penalize routes to MetLife that thread through Penn Station, and attach
 * the standard transit warning. Returns a possibly-augmented plan.
 * Exported so it can be unit-tested without a network call.
 */
export function applyMetLifeTransitRule(plan: RoutePlan): RoutePlan {
  const goingToMetLife =
    haversineKm(plan.to, LANDMARKS.metlifeStadium) < 1.5;
  if (!goingToMetLife) return plan;

  const warnings = [...plan.warnings];
  const throughPenn =
    distancePointToPolylineKm(LANDMARKS.pennStation, plan.geometry) <
    PENN_PROXIMITY_KM;

  let durationMin = plan.durationMin;
  if (throughPenn) {
    warnings.push(
      "Route passes through Penn Station — the worst match-day chokepoint. " +
        "Reroute via Secaucus Junction to skip the crush.",
    );
    durationMin += 15; // honest time penalty for the chokepoint
  } else {
    warnings.push(
      "Heading to MetLife: enter via Secaucus Junction, not Penn Station.",
    );
  }

  return { ...plan, warnings, durationMin: Math.round(durationMin) };
}

function straightLineFallback(
  from: LatLng,
  to: LatLng,
  mode: TravelMode,
): RoutePlan {
  const distanceKm = haversineKm(from, to);
  return {
    from,
    to,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMin: Math.round((distanceKm / AVG_TRANSIT_KMH) * 60),
    geometry: [from, to],
    warnings: ["Estimated route (live router unavailable)."],
    mode,
  };
}

interface OsrmRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: { coordinates: [number, number][] }; // [lng, lat]
}

/** Plan a route. `fetchImpl` is injectable for testing. */
export async function planRoute(
  req: RouteRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<RoutePlan> {
  const mode = req.mode ?? "transit";
  const base = process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org";
  // OSRM has no transit profile; use driving as a metro proxy.
  const profile = mode === "walking" ? "walking" : "driving";
  const url =
    `${base}/route/v1/${profile}/` +
    `${req.from.lng},${req.from.lat};${req.to.lng},${req.to.lat}` +
    `?overview=full&geometries=geojson`;

  let plan: RoutePlan;
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = (await res.json()) as { routes?: OsrmRoute[] };
    const route = data.routes?.[0];
    if (!route) throw new Error("No route returned");
    plan = {
      from: req.from,
      to: req.to,
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      warnings: [],
      mode,
    };
  } catch {
    plan = straightLineFallback(req.from, req.to, mode);
  }

  return applyMetLifeTransitRule(plan);
}
