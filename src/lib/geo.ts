import type { LatLng } from "@/types";

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in kilometers. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** True when `point` lies within `radiusKm` of `center`. */
export function withinRadius(
  point: LatLng,
  center: LatLng,
  radiusKm: number,
): boolean {
  return haversineKm(point, center) <= radiusKm;
}

/** Midpoint (linear approximation, fine for metro-scale distances). */
export function midpoint(a: LatLng, b: LatLng): LatLng {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}

export interface BBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

/** Bounding box that contains all given points. */
export function boundingBox(points: LatLng[]): BBox {
  if (points.length === 0) {
    throw new Error("boundingBox requires at least one point");
  }
  return points.reduce<BBox>(
    (box, p) => ({
      minLat: Math.min(box.minLat, p.lat),
      minLng: Math.min(box.minLng, p.lng),
      maxLat: Math.max(box.maxLat, p.lat),
      maxLng: Math.max(box.maxLng, p.lng),
    }),
    {
      minLat: points[0].lat,
      minLng: points[0].lng,
      maxLat: points[0].lat,
      maxLng: points[0].lng,
    },
  );
}

/**
 * Shortest distance from a point to a line segment, in km.
 * Used by the routing layer to test proximity of a polyline to a hub
 * (e.g. "does this route pass through Penn Station?").
 */
export function distanceToSegmentKm(
  p: LatLng,
  a: LatLng,
  b: LatLng,
): number {
  // Project into a local equirectangular plane (km) centered on `a`.
  const latRef = toRad(a.lat);
  const toXY = (q: LatLng) => ({
    x: toRad(q.lng - a.lng) * Math.cos(latRef) * EARTH_RADIUS_KM,
    y: toRad(q.lat - a.lat) * EARTH_RADIUS_KM,
  });
  const P = toXY(p);
  const B = toXY(b);
  const lenSq = B.x * B.x + B.y * B.y;
  if (lenSq === 0) return Math.hypot(P.x, P.y);
  let t = (P.x * B.x + P.y * B.y) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: t * B.x, y: t * B.y };
  return Math.hypot(P.x - proj.x, P.y - proj.y);
}

/**
 * Minimum distance (km) from a hub to any segment of a polyline.
 * Returns Infinity for an empty/single-point line.
 */
export function distancePointToPolylineKm(
  hub: LatLng,
  polyline: LatLng[],
): number {
  if (polyline.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    min = Math.min(min, distanceToSegmentKm(hub, polyline[i], polyline[i + 1]));
  }
  return min;
}

/** A few well-known NYC/NJ landmarks the app reasons about. */
export const LANDMARKS = {
  metlifeStadium: { lat: 40.8128, lng: -74.0742 },
  pennStation: { lat: 40.7506, lng: -73.9935 },
  portAuthority: { lat: 40.7570, lng: -73.9903 },
  secaucusJunction: { lat: 40.7616, lng: -74.0757 },
} as const satisfies Record<string, LatLng>;
