import type { GatheringPlace, Match } from "./types";
import { MOCK_PLACES, TEAMS, TODAY_MATCH, filterPlaces } from "./mock-data";
import { isTransitQuery, planTransitToMatch } from "./match-route";

export interface UserPreferences {
  team: string;
  crowd: number; // 0 = quiet, 100 = party
  maxTravelMin: number;
  accessibleOnly: boolean;
  nativeLanguage: boolean;
  originLabel: string;
}

export interface TransitPlan {
  leaveBy: string;
  durationMin: number;
  summary: string;
  steps: string[];
  warning?: string;
}

export interface ChatRecommendation {
  primary: GatheringPlace;
  backup?: GatheringPlace;
  transit: TransitPlan;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendation?: ChatRecommendation;
  suggestedPlaceIds?: string[];
  showRouteToMatch?: boolean;
}

const ORIGIN = { lat: 40.7465, lng: -74.0014, label: "Chelsea, Manhattan" };

const CROWD_MAP = (n: number): "quiet" | "authentic" | "party" | "all" => {
  if (n < 30) return "quiet";
  if (n < 65) return "authentic";
  if (n < 85) return "all";
  return "party";
};

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scorePlace(
  place: GatheringPlace,
  prefs: UserPreferences,
  message: string
): number {
  const msg = message.toLowerCase();
  let score = 50;

  const crowdPref = prefs.crowd;
  const crowdVal =
    place.crowdLevel === "high" ? 90 : place.crowdLevel === "medium" ? 50 : 15;
  score -= Math.abs(crowdVal - crowdPref) * 0.4;

  if (prefs.accessibleOnly && !place.adaAccessible) score -= 80;
  if (prefs.nativeLanguage) {
    const team = TEAMS.find((t) => t.code === prefs.team);
    const lang =
      prefs.team === "FRA"
        ? "fr"
        : prefs.team === "MEX"
          ? "es"
          : prefs.team === "BRA"
            ? "pt"
            : "en";
    if (place.languages.includes(lang)) score += 20;
  }

  const dist = haversineKm(ORIGIN.lat, ORIGIN.lng, place.lat, place.lng);
  const travelEst = dist * 4 + 10;
  if (travelEst > prefs.maxTravelMin) score -= 40;
  else score -= travelEst * 0.3;

  if (place.confidence === "confirmed") score += 25;
  if (place.confidence === "community") score += 5;

  if (msg.includes("line") || msg.includes("wait") || msg.includes("crowd")) {
    if (place.crowdLevel === "low") score += 25;
    if (place.crowdLevel === "high") score -= 20;
  }
  if (msg.includes("party") || msg.includes("energy") || msg.includes("loud")) {
    if (place.crowdLevel === "high") score += 25;
  }
  if (msg.includes("quiet") || msg.includes("calm")) {
    if (place.crowdLevel === "low") score += 30;
  }
  if (msg.includes("french") || msg.includes("français") || msg.includes("france")) {
    if (place.languages.includes("fr")) score += 15;
  }
  if (msg.includes("wheelchair") || msg.includes("accessible") || msg.includes("step-free")) {
    if (place.adaAccessible) score += 30;
    else score -= 50;
  }

  return score;
}

export function planTransit(
  place: GatheringPlace,
  match: Match | null
): TransitPlan {
  const isNj = place.lng < -74.02 || place.neighborhood.toLowerCase().includes("nj");
  const arrive = place.arriveBy ?? "6:30 PM";

  if (isNj) {
    return {
      leaveBy: "5:35 PM",
      durationMin: 42,
      summary: "Chelsea → Secaucus/Meadowlands area",
      steps: [
        "Walk to 14 St–Union Sq (8 min)",
        "N/Q/R/W to 34 St–Herald Sq (6 min)",
        "NJ Transit / Meadowlands bus from Port Authority or Secaucus transfer (~22 min)",
        "Walk to venue (5 min)",
      ],
      warning:
        match?.venueName === "MetLife Stadium"
          ? "Avoid Penn Station 5:30–9pm — use Port Authority or PATH to Hoboken → Secaucus when possible."
          : undefined,
    };
  }

  if (place.neighborhood.includes("Queens")) {
    return {
      leaveBy: "5:50 PM",
      durationMin: 35,
      summary: "Chelsea → Queens",
      steps: [
        "Walk to 14 St–Union Sq (8 min)",
        "N/W to Queensboro Plaza or 7 train (18 min)",
        "Walk to venue (6 min)",
      ],
    };
  }

  return {
    leaveBy: arrive ? subtractMinutes(arrive, 25) : "5:45 PM",
    durationMin: 22,
    summary: `Chelsea → ${place.neighborhood}`,
    steps: [
      "Walk to 14 St–Union Sq (8 min)",
      "Local train north/south (~10 min)",
      "Walk to venue (4 min)",
    ],
  };
}

function subtractMinutes(time12: string, mins: number): string {
  const [t, period] = time12.split(" ");
  const [h, m] = t.split(":").map(Number);
  let total = (h % 12) * 60 + m + (period === "PM" && h !== 12 ? 720 : 0);
  if (period === "AM" && h === 12) total = m;
  total -= mins;
  const nh = Math.floor(((total / 60) % 12) || 12);
  const nm = total % 60;
  const np = total >= 720 ? "PM" : "AM";
  return `${nh}:${nm.toString().padStart(2, "0")} ${np}`;
}

function pickRecommendations(
  prefs: UserPreferences,
  message: string
): { primary: GatheringPlace; backup?: GatheringPlace; ranked: GatheringPlace[] } {
  const intent = CROWD_MAP(prefs.crowd);
  let pool = filterPlaces(MOCK_PLACES, prefs.team, intent);

  if (pool.length === 0) {
    pool = filterPlaces(MOCK_PLACES, prefs.team, "all");
  }

  const ranked = [...pool]
    .map((p) => ({ place: p, score: scorePlace(p, prefs, message) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.place);

  const primary = ranked[0];
  const backup = ranked.find(
    (p) => p.id !== primary?.id && p.crowdLevel !== primary?.crowdLevel
  );

  return { primary, backup, ranked };
}

function teamLabel(code: string): string {
  return TEAMS.find((t) => t.code === code)?.name ?? code;
}

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 11)}`;
}

export function generateChatReply(
  message: string,
  prefs: UserPreferences
): { reply: ChatMessage; ranked: GatheringPlace[]; showRouteToMatch?: boolean } {
  const match =
    prefs.team === "FRA" || prefs.team === "USA" ? TODAY_MATCH : null;

  if (isTransitQuery(message) && match) {
    const transit = planTransitToMatch(match);
    const content = `**Route to ${match.venueName}** from ${prefs.originLabel}\n\nLeave by **${transit.leaveBy}** (~${transit.durationMin} min).\n\n${transit.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}${transit.warning ? `\n\n⚠️ ${transit.warning}` : ""}\n\nTap **Get to the match** on the map — the yellow route is pinned for you.`;

    return {
      reply: {
        id: uid(),
        role: "assistant",
        content,
        showRouteToMatch: true,
      },
      ranked: [],
      showRouteToMatch: true,
    };
  }

  const { primary, backup, ranked } = pickRecommendations(prefs, message);

  if (!primary) {
    return {
      reply: {
        id: uid(),
        role: "assistant",
        content:
          "I couldn't find a spot for that team yet. Try another team or widen your travel time slider.",
      },
      ranked: [],
    };
  }

  const transit = planTransit(primary, match);
  const crowdWord =
    prefs.crowd < 30 ? "quieter" : prefs.crowd > 70 ? "high-energy" : "balanced";

  let content = `Here's your **Watch Contract** for ${teamLabel(prefs.team)} fans.\n\n`;
  content += `**Primary — ${primary.name}** (${primary.neighborhood})\n`;
  content += `${primary.description}\n`;
  content += `Arrive by **${primary.arriveBy ?? "before kickoff"}** · ${primary.confidence === "confirmed" ? "Confirmed event" : "Likely fan spot"}\n\n`;

  if (backup) {
    content += `**Backup — ${backup.name}** if lines are long (${backup.neighborhood}, ${backup.crowdLevel === "low" ? "quieter" : "moderate"}).\n\n`;
  }

  content += `**Transit from ${prefs.originLabel}**\n`;
  content += `Leave by **${transit.leaveBy}** (~${transit.durationMin} min)\n`;
  if (transit.warning) content += `⚠️ ${transit.warning}\n`;

  content += `\nI tuned this for **${crowdWord}** vibes based on your sliders.`;

  return {
    reply: {
      id: crypto.randomUUID(),
      role: "assistant",
      content,
      recommendation: {
        primary,
        backup,
        transit,
      },
      suggestedPlaceIds: ranked.slice(0, 4).map((p) => p.id),
    },
    ranked,
  };
}

export const SUGGESTED_PROMPTS = [
  "How do I get to the match from Chelsea?",
  "Where are French fans gathering near MetLife?",
  "Quiet spot with good screens — no long lines",
  "Senegal fans in Brooklyn tonight",
];

export const DEFAULT_PREFS: UserPreferences = {
  team: "FRA",
  crowd: 55,
  maxTravelMin: 45,
  accessibleOnly: false,
  nativeLanguage: true,
  originLabel: ORIGIN.label,
};
