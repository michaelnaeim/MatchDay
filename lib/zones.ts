/** NYC/NJ fan zones with map coordinates */
export interface ZoneGeo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  team: string;
  venueId?: string;
}

export const ZONE_GEO: ZoneGeo[] = [
  { id: "secaucus", name: "Secaucus / Meadowlands", lat: 40.7892, lng: -74.0561, team: "FRA", venueId: "evt-1" },
  { id: "harlem", name: "Harlem", lat: 40.8116, lng: -73.9465, team: "SEN" },
  { id: "yorkville", name: "Yorkville", lat: 40.7734, lng: -73.9542, team: "FRA", venueId: "evt-2" },
  { id: "bedstuy", name: "Bed-Stuy", lat: 40.6831, lng: -73.9389, team: "SEN" },
  { id: "ues", name: "Upper East Side", lat: 40.7651, lng: -73.9682, team: "FRA", venueId: "evt-3" },
  { id: "penn", name: "Penn Station", lat: 40.7505, lng: -73.9934, team: "neutral" },
  { id: "chelsea", name: "Chelsea", lat: 40.7465, lng: -74.0014, team: "neutral" },
  { id: "astoria", name: "Astoria", lat: 40.7615, lng: -73.9256, team: "BRA", venueId: "bra-1" },
  { id: "corona", name: "Corona", lat: 40.7468, lng: -73.8642, team: "MEX", venueId: "mex-1" },
  { id: "times_sq", name: "Times Square", lat: 40.758, lng: -73.9855, team: "neutral" },
];

const KEYWORDS: Record<string, string[]> = {
  secaucus: ["secaucus", "meadowlands", "metlife", "rutherford", "nj"],
  harlem: ["harlem", "125th"],
  yorkville: ["yorkville", "french", "français", "bleu", "bistro"],
  bedstuy: ["bed-stuy", "bedstuy", "nostrand", "brooklyn", "senegal", "lion"],
  ues: ["upper east", "ues", "alliance française", "alliance francaise"],
  penn: ["penn station", "path", "transit"],
  chelsea: ["chelsea", "manhattan"],
  astoria: ["astoria", "brazil", "samba"],
  corona: ["corona", "queens", "mexico"],
  times_sq: ["times square", "midtown"],
};

export function zoneFromText(text: string): ZoneGeo | null {
  const lower = text.toLowerCase();
  for (const zone of ZONE_GEO) {
    const keys = KEYWORDS[zone.id] ?? [];
    if (keys.some((k) => lower.includes(k))) return zone;
  }
  return null;
}

export function zoneById(id: string): ZoneGeo | undefined {
  return ZONE_GEO.find((z) => z.id === id);
}
