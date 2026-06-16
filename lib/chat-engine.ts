import type { GatheringPlace, Match } from "./types";
import { MOCK_PLACES, TEAMS, TODAY_MATCH, filterPlaces } from "./mock-data";
import { isTransitQuery, planTransitToMatch } from "./match-route";
import { FEATURED_MATCH } from "./live-simulation";
import {
  crowdLabel,
  defaultRivalFor,
  isRoastQuery,
  pickRoastLine,
  pickRoastLines,
  teamFlag,
  teamName,
} from "./rival-banter";

export interface UserPreferences {
  team: string;
  crowd: number; // 0 = quiet, 100 = party
  maxTravelMin: number;
  accessibleOnly: boolean;
  nativeLanguage: boolean;
  originLabel: string;
  /** Prefer spots with only your team's fans */
  ownFansOnly: boolean;
  /** Playful rival trash-talk in replies */
  rivalRoast: boolean;
  /** Team to clown on in banter */
  rivalTeam: string;
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
  score -= Math.abs(crowdVal - crowdPref) * 0.55;
  if (prefs.crowd > 75 && place.crowdLevel === "high") score += 18;
  if (prefs.crowd < 30 && place.crowdLevel === "low") score += 12;

  if (prefs.ownFansOnly) {
    if (place.teamTags.length === 1 && place.teamTags[0] === prefs.team) score += 22;
    if (place.teamTags.includes("neutral")) score -= 15;
    if (place.teamTags.includes(prefs.rivalTeam)) score -= 100;
  }

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

type QueryKind = "transit" | "live" | "watch" | "greeting" | "roast";

function detectQueryKind(message: string): QueryKind {
  const m = message.toLowerCase();
  if (isRoastQuery(message)) return "roast";
  if (isTransitQuery(message)) return "transit";
  if (
    /heat|surge|live fan|pulse|where.*hot|eventbrite|reddit|luma|map/.test(m) &&
    !/watch party|where.*watch/.test(m)
  ) {
    return "live";
  }
  if (/^(hi|hello|hey|help|what can you)/.test(m)) return "greeting";
  return "watch";
}

function teamFromMessage(message: string, fallback: string): string {
  const m = message.toLowerCase();
  if (/senegal|teranga|lions|🇸🇳|harlem|bed-stuy|bedstuy/.test(m)) return "SEN";
  if (/france|french|bleu|les bleus|🇫🇷|yorkville|metlife|meadowlands/.test(m)) return "FRA";
  if (/mexico|mexican|🇲🇽/.test(m)) return "MEX";
  if (/brazil|brazilian|🇧🇷/.test(m)) return "BRA";
  if (/usa|american|🇺🇸/.test(m)) return "USA";
  if (/argentina|🇦🇷/.test(m)) return "ARG";
  return fallback;
}

function neighborhoodFromMessage(message: string): string | null {
  const m = message.toLowerCase();
  if (/harlem/.test(m)) return "Harlem";
  if (/bed-stuy|bedstuy|brooklyn/.test(m)) return "Bed-Stuy";
  if (/yorkville|ues|upper east/.test(m)) return "Yorkville";
  if (/secaucus|meadowlands|metlife|nj|jersey/.test(m)) return "Secaucus";
  if (/queens|flushing/.test(m)) return "Queens";
  if (/chelsea|manhattan/.test(m)) return "Manhattan";
  return null;
}

function livePulseReply(prefs: UserPreferences): string {
  const team = teamLabel(prefs.team);
  const zones =
    prefs.team === "SEN"
      ? "**Harlem** and **Bed-Stuy** are surging on the map — Reddit + Eventbrite signals in the last hour."
      : prefs.team === "FRA"
        ? "**Secaucus/Meadowlands** and **Yorkville** are hottest — Eventbrite watch parties + French bistro overflow."
        : `Fan heat is clustering around **${team}**-tagged zones on the map.`;

  return `**Live city pulse** · France **2–1** Senegal · ${FEATURED_MATCH.minute}' at MetLife\n\n${zones}\n\nCheck the **live fan chat** strip for real-time chatter, and the map pulses for neighborhood heat. Ask me *where to watch* and I'll pin a **Watch Contract** with transit from **${prefs.originLabel}**.`;
}

function greetingReply(prefs: UserPreferences): string {
  const rival = teamName(prefs.rivalTeam);
  const roastHint = prefs.rivalRoast
    ? `\n\n🔥 **Rival roast mode** is ON — I'll clown on **${rival}** fans when it helps.`
    : "";
  const fansHint = prefs.ownFansOnly
    ? `\n\n🛡️ **Fans** — skipping mixed bars and ${rival} zones.`
    : "";
  return `I'm your **Match Day guide** — live map heat + your sliders → **Watch Contract** with transit from **${prefs.originLabel}**.${fansHint}${roastHint}\n\n**Tonight:** 🇫🇷 France **2–1** 🇸🇳 Senegal at **MetLife** (${FEATURED_MATCH.minute}').\n\nTry:\n• *Packed French bar — no rival fans*\n• *Roast Senegal and find Les Bleus territory*\n• *How do I get to MetLife without Penn Station?*`;
}

function roastReply(prefs: UserPreferences): string {
  const lines = pickRoastLines(prefs.team, prefs.rivalTeam, 3);
  const my = teamName(prefs.team);
  const rival = teamName(prefs.rivalTeam);
  const body = lines.map((l) => `• ${l}`).join("\n");
  return `**Rival report** · ${teamFlag(prefs.team)} ${my} vs ${teamFlag(prefs.rivalTeam)} ${rival}\n\n${body}\n\n${prefs.ownFansOnly ? "🛡️ **Fans** filter keeps you out of rival watch zones — chef's kiss." : "Toggle **Fans** if you want zero rival energy in the room."}\n\nWant a spot to match the smoke? Ask *where to watch* and I'll pin it on the map.`;
}

function buildWatchReply(
  message: string,
  prefs: UserPreferences,
  primary: GatheringPlace,
  backup: GatheringPlace | undefined,
  transit: TransitPlan,
  match: Match | null
): string {
  const team = teamLabel(prefs.team);
  const crowdWord = crowdLabel(prefs.crowd);
  const hood = neighborhoodFromMessage(message);
  const liveCtx =
    primary.source === "eventbrite"
      ? "Confirmed on **Eventbrite** — map heat aligns."
      : primary.source === "reddit"
        ? "**r/nyc** signal in the last hour — verify before you go."
        : primary.source === "luma"
          ? "**Luma** listing — RSVP recommended."
          : "Curated fan intel for match day.";

  let content = `**Watch Contract** · ${team} fans · ${crowdWord} vibe\n`;
  if (match) {
    content += `Match context: **${match.venueName}** is live — this spot keeps you in the fan zone without the stadium crush.\n\n`;
  }
  if (hood) {
    content += `You asked about **${hood}** — here's the best fit within your **${prefs.maxTravelMin} min** travel cap:\n\n`;
  }

  content += `**Primary — ${primary.name}**\n`;
  content += `${primary.neighborhood} · ${liveCtx}\n`;
  content += `${primary.description}\n`;
  content += `Arrive **${primary.arriveBy ?? "before kickoff"}** · ${primary.confidence === "confirmed" ? "✓ Confirmed" : "Likely / community tip"}\n`;
  if (primary.adaAccessible) content += `♿ Step-free / ADA friendly\n`;
  content += `\n`;

  if (backup) {
    content += `**Backup — ${backup.name}** (${backup.neighborhood})\n`;
    content += `${backup.crowdLevel === "low" ? "Shorter lines" : "Different energy"} if ${primary.name.split("—")[0].trim()} is full.\n\n`;
  }

  content += `**Getting there from ${prefs.originLabel}**\n`;
  content += `Leave **${transit.leaveBy}** · ~**${transit.durationMin} min**\n`;
  transit.steps.slice(0, 3).forEach((s, i) => {
    content += `${i + 1}. ${s}\n`;
  });
  if (transit.warning) content += `\n⚠️ ${transit.warning}\n`;

  if (prefs.ownFansOnly) {
    content += `\n🛡️ **Fans** — filtered out ${teamName(prefs.rivalTeam)}-leaning spots.\n`;
  }
  if (prefs.rivalRoast) {
    content += `\n🔥 **Rival roast:** ${pickRoastLine(prefs.team, prefs.rivalTeam)}\n`;
  }

  content += `\nPinned on your map — tap the card or ask for **route to MetLife** if you're heading to the stadium.`;
  return content;
}

export function generateChatReply(
  message: string,
  prefs: UserPreferences
): { reply: ChatMessage; ranked: GatheringPlace[]; showRouteToMatch?: boolean } {
  const effectivePrefs = {
    ...prefs,
    team: teamFromMessage(message, prefs.team),
  };
  const match =
    effectivePrefs.team === "FRA" ||
    effectivePrefs.team === "SEN" ||
    effectivePrefs.team === "USA"
      ? TODAY_MATCH
      : null;
  const kind = detectQueryKind(message);

  if (kind === "greeting") {
    return {
      reply: { id: uid(), role: "assistant", content: greetingReply(prefs) },
      ranked: [],
    };
  }

  if (kind === "roast") {
    return {
      reply: { id: uid(), role: "assistant", content: roastReply(prefs) },
      ranked: [],
    };
  }

  if (kind === "live") {
    return {
      reply: { id: uid(), role: "assistant", content: livePulseReply(effectivePrefs) },
      ranked: [],
    };
  }

  if (kind === "transit" && match) {
    const transit = planTransitToMatch(match);
    const content = `**Stadium run** · ${match.venueName}\n\n🇫🇷 **2–1** 🇸🇳 · ${FEATURED_MATCH.minute}' · leave **${prefs.originLabel}** by **${transit.leaveBy}** (~${transit.durationMin} min)\n\n${transit.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}${transit.warning ? `\n\n⚠️ ${transit.warning}` : ""}\n\nThe **yellow route** is on your map. Stadium gates get brutal after 6:30 — this path skips the worst of Penn when you can.`;

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

  const { primary, backup, ranked } = pickRecommendations(effectivePrefs, message);

  if (!primary) {
    return {
      reply: {
        id: uid(),
        role: "assistant",
        content: `No strong **${teamLabel(effectivePrefs.team)}** watch spots match your sliders yet. Widen **max travel** or switch team — live fan chat may have fresh Reddit tips.`,
      },
      ranked: [],
    };
  }

  const transit = planTransit(primary, match);
  const content = buildWatchReply(
    message,
    effectivePrefs,
    primary,
    backup,
    transit,
    match
  );

  return {
    reply: {
      id: uid(),
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
  "Packed French bar — Fans only, no rivals",
  "Roast Senegal fans & find Les Bleus territory",
  "Clown on Senegal — they're cooked tonight",
  "Absolute chaos watch party near MetLife",
  "Trash talk my rival then pin a watch spot",
  "How do I get to MetLife without Penn Station?",
];

export const DEFAULT_PREFS: UserPreferences = {
  team: "FRA",
  crowd: 72,
  maxTravelMin: 45,
  accessibleOnly: false,
  nativeLanguage: true,
  originLabel: ORIGIN.label,
  ownFansOnly: true,
  rivalRoast: true,
  rivalTeam: "SEN",
};
