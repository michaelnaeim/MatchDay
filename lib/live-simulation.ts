import type { Match } from "./types";

export interface LivePulseZone {
  id: string;
  name: string;
  emoji: string;
  intensity: number;
  trend: "rising" | "stable" | "surge";
  label: string;
  venueId?: string;
  team: string;
}

export interface LiveFanMessage {
  id: string;
  user: string;
  avatar: string;
  zone: string;
  text: string;
  team: string;
  ts: number;
}

export const FEATURED_MATCH: Match & {
  stage: string;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: "live" | "halftime" | "countdown";
  metroWatching: number;
  possession: [number, number];
  shots: [number, number];
} = {
  id: "wc2026-fra-sen",
  home: "FRA",
  away: "SEN",
  homeName: "France",
  awayName: "Senegal",
  homeFlag: "🇫🇷",
  awayFlag: "🇸🇳",
  homeScore: 2,
  awayScore: 1,
  minute: 73,
  status: "live",
  stage: "Group Stage",
  kickoff: "2026-06-28T19:00:00-04:00",
  venueName: "MetLife Stadium",
  lat: 40.8135,
  lng: -74.0745,
  metroWatching: 51842,
  possession: [58, 42],
  shots: [14, 9],
};

const CHAT_POOL: Omit<LiveFanMessage, "id" | "ts">[] = [
  { user: "marie_paris", avatar: "🇫🇷", zone: "Yorkville", text: "ALLEZ LES BLEUS!!! What a finish 🔥", team: "FRA" },
  { user: "amadou_harlem", avatar: "🇸🇳", zone: "Harlem", text: "Lions still in this!! Diallo almost equalizes", team: "SEN" },
  { user: "secaucus_kyle", avatar: "🍺", zone: "Secaucus", text: "Gate 4 line finally moving — 200 deep", team: "FRA" },
  { user: "bleu_nyc", avatar: "⚽", zone: "Watch Party", text: "Mbappé MOTM so far no debate", team: "FRA" },
  { user: "dakar_in_nyc", avatar: "🦁", zone: "Brooklyn", text: "Senegal house PACKED on Nostrand", team: "SEN" },
  { user: "nj_transit", avatar: "🚂", zone: "Penn Station", text: "PATH > NJT tonight trust me", team: "neutral" },
  { user: "sophie_uws", avatar: "🥂", zone: "Alliance Française", text: "Standing room only but worth it", team: "FRA" },
  { user: "lioness_queens", avatar: "🇸🇳", zone: "Queens", text: "Sadio chants echoing through the block", team: "SEN" },
  { user: "mbappe_goat", avatar: "🔥", zone: "MetLife", text: "GOOOAL replay on the big screen!!!", team: "FRA" },
  { user: "chelsea_sam", avatar: "🗽", zone: "Chelsea", text: "Whole city is buzzing rn", team: "neutral" },
  { user: "metlife_section", avatar: "👀", zone: "East Rutherford", text: "French + Senegalese sections going crazy", team: "neutral" },
  { user: "luma_host", avatar: "📍", zone: "Secaucus", text: "+340 checked in last 20 min", team: "FRA" },
  { user: "tourist_ana", avatar: "✈️", zone: "JFK arrival", text: "Just landed — where's the Senegal crowd??", team: "SEN" },
  { user: "fanatlas", avatar: "◆", zone: "Fan Atlas", text: "Harlem surge · Senegal fans +22%", team: "SEN" },
  { user: "yorkville_pierre", avatar: "🇫🇷", zone: "Yorkville", text: "Bistro screens all showing the same replay", team: "FRA" },
  { user: "bedstuy_lions", avatar: "🇸🇳", zone: "Bed-Stuy", text: "Free street screen on Fulton — come through", team: "SEN" },
  { user: "penn_warning", avatar: "⚠️", zone: "Penn", text: "Avoid main concourse next 45 min", team: "neutral" },
  { user: "les_bleus_nj", avatar: "🇫🇷", zone: "Meadowlands", text: "Pre-gaming hard before 2nd half ends", team: "FRA" },
  { user: "dakar_diaspora", avatar: "🦁", zone: "Bronx", text: "Senegal flag on every balcony lol", team: "SEN" },
  { user: "stats_nerd", avatar: "📊", zone: "Fan Atlas", text: "58% possession FRA · 9 shots SEN", team: "neutral" },
  { user: "access_fan", avatar: "♿", zone: "UES", text: "Captions + ADA seating perfect here", team: "FRA" },
  { user: "times_sq", avatar: "🌆", zone: "Times Square", text: "Mega screen crowd erupted on that goal", team: "neutral" },
  { user: "corona_miguel", avatar: "🇲🇽", zone: "Corona", text: "Saving seats for Mexico match later", team: "MEX" },
  { user: "french_touch", avatar: "🇫🇷", zone: "SoHo", text: "Wine bar turned full watch party", team: "FRA" },
];

const PULSE_ZONES: LivePulseZone[] = [
  {
    id: "secaucus",
    name: "Secaucus / Meadowlands",
    emoji: "🏟️",
    intensity: 97,
    trend: "surge",
    label: "Stadium corridor · both fanbases",
    venueId: "evt-1",
    team: "FRA",
  },
  {
    id: "harlem",
    name: "Harlem",
    emoji: "🇸🇳",
    intensity: 91,
    trend: "surge",
    label: "Senegal diaspora · street energy",
    team: "SEN",
  },
  {
    id: "yorkville",
    name: "Yorkville",
    emoji: "🇫🇷",
    intensity: 89,
    trend: "surge",
    label: "French hub · every screen full",
    venueId: "evt-2",
    team: "FRA",
  },
  {
    id: "bedstuy",
    name: "Bed-Stuy",
    emoji: "🦁",
    intensity: 84,
    trend: "rising",
    label: "Senegal watch houses · outdoor screens",
    team: "SEN",
  },
  {
    id: "ues",
    name: "Upper East Side",
    emoji: "🎬",
    intensity: 64,
    trend: "stable",
    label: "Alliance Française · seated viewing",
    venueId: "evt-3",
    team: "FRA",
  },
  {
    id: "penn",
    name: "Penn Station",
    emoji: "⚠️",
    intensity: 95,
    trend: "stable",
    label: "Transit crush · reroute advised",
    team: "neutral",
  },
];

let chatIdx = 0;

export function nextLiveMessage(teamFilter?: string): LiveFanMessage {
  const pool = teamFilter
    ? CHAT_POOL.filter(
        (m) =>
          m.team === teamFilter || m.team === "neutral" || m.team === "SEN" || m.team === "FRA"
      )
    : CHAT_POOL;
  const item = pool[chatIdx % pool.length];
  chatIdx += 1;
  return {
    ...item,
    id: `live-${chatIdx}`,
    ts: Date.now(),
  };
}

/** Build a long list for seamless ticker loops */
export function buildTickerMessages(count = 24): LiveFanMessage[] {
  const out: LiveFanMessage[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ ...nextLiveMessage(), id: `ticker-${i}` });
  }
  return out;
}

export function getPulseZones(team?: string): LivePulseZone[] {
  const zones = [...PULSE_ZONES];
  if (!team) return zones;
  return zones.sort((a, b) => {
    const aBoost = a.team === team ? 1 : 0;
    const bBoost = b.team === team ? 1 : 0;
    return bBoost - aBoost || b.intensity - a.intensity;
  });
}

export function jitterPulse(zones: LivePulseZone[]): LivePulseZone[] {
  return zones.map((z) => {
    const delta = Math.floor(Math.random() * 9) - 3;
    const intensity = Math.min(100, Math.max(25, z.intensity + delta));
    const trend: LivePulseZone["trend"] =
      delta > 3 ? "surge" : delta < -1 ? "stable" : z.trend;
    return { ...z, intensity, trend };
  });
}

export const INITIAL_LIVE_CHAT: LiveFanMessage[] = CHAT_POOL.slice(0, 12).map(
  (m, i) => ({
    ...m,
    id: `init-${i}`,
    ts: 1_700_000_000_000 + i * 3000,
  })
);
