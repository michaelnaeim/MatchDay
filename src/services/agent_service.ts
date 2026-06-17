import Groq from "groq-sdk";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "groq-sdk/resources/chat/completions";
import {
  type ChatRecommendation,
  type UserPreferences,
  planTransit,
} from "@/lib/chat-engine";
import { backendMatchToUI, scoredVenueToPlace } from "@/lib/venue-mapper";
import type { GatheringPlace } from "@/lib/types";
import type { Intent, LatLng, RoutePlan, TeamCode, WatchContract } from "@/types";
import { findFanGatherings } from "@/services/gatherings_service";
import { assembleWatchContract } from "@/services/watch_contract";
import { planRoute } from "@/services/routing_service";
import type { Repo } from "@/services/repo";

const FAN_ORIGIN: LatLng = { lat: 40.7465, lng: -74.0014 };
const MAX_TOOL_ROUNDS = 6;
const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export interface AgentChatResult {
  content: string;
  places: GatheringPlace[];
  recommendation?: ChatRecommendation;
  showRouteToMatch?: boolean;
  updatedAt?: string;
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

function intentFromCrowd(crowd: number): Intent {
  if (crowd < 30) return "quiet";
  if (crowd < 65) return "authentic";
  return "party";
}

function commentaryLanguageFor(prefs: UserPreferences): string | undefined {
  if (!prefs.nativeLanguage) return undefined;
  switch (prefs.team) {
    case "FRA":
      return "French";
    case "SEN":
      return "Wolof";
    case "BRA":
      return "Portuguese";
    case "MEX":
      return "Spanish";
    default:
      return "English";
  }
}

function formatArriveBy(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function routeToTransit(
  plan: RoutePlan,
  originLabel: string,
  destinationLabel: string
): ChatRecommendation["transit"] {
  return {
    leaveBy: "See plan",
    durationMin: plan.durationMin,
    summary: `${originLabel} → ${destinationLabel}`,
    steps: [
      `${plan.distanceKm} km · ~${plan.durationMin} min (${plan.mode})`,
      ...plan.warnings,
    ],
    warning: plan.warnings[0],
  };
}

function contractToRecommendation(
  contract: WatchContract,
  prefs: UserPreferences
): ChatRecommendation {
  const primary = scoredVenueToPlace(contract.primary);
  const backup = scoredVenueToPlace(contract.backup);
  const uiMatch = backendMatchToUI(contract.match);

  if (contract.route) {
    return {
      primary: { ...primary, arriveBy: formatArriveBy(contract.arriveBy) },
      backup,
      transit: routeToTransit(
        contract.route,
        prefs.originLabel,
        primary.neighborhood
      ),
    };
  }

  const transit = planTransit(primary, uiMatch);
  if (contract.transitWarning) {
    transit.warning = contract.transitWarning;
  }
  return { primary, backup, transit };
}

function summarizeVenues(venues: ReturnType<typeof scoredVenueToPlace>[]) {
  return venues.slice(0, 6).map((v) => ({
    id: v.id,
    name: v.name,
    neighborhood: v.neighborhood,
    crowdLevel: v.crowdLevel,
    confidence: v.confidence,
    description: v.description,
  }));
}

function summarizeContract(contract: WatchContract) {
  return {
    match: {
      id: contract.match.id,
      home: contract.match.homeTeam,
      away: contract.match.awayTeam,
      venueName: contract.match.venueName,
      kickoff: contract.match.kickoff,
    },
    intent: contract.intent,
    arriveBy: contract.arriveBy,
    transitWarning: contract.transitWarning,
    primary: {
      id: contract.primary.venue.id,
      name: contract.primary.venue.name,
      score: contract.primary.score,
      confidence: contract.primary.confidence,
      reasons: contract.primary.reasons.slice(0, 4),
    },
    backup: {
      id: contract.backup.venue.id,
      name: contract.backup.venue.name,
      score: contract.backup.score,
      confidence: contract.backup.confidence,
    },
    route: contract.route
      ? {
          durationMin: contract.route.durationMin,
          distanceKm: contract.route.distanceKm,
          warnings: contract.route.warnings,
        }
      : undefined,
  };
}

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_matches",
      description: "List World Cup matches, optionally filtered by team or date.",
      parameters: {
        type: "object",
        properties: {
          team: {
            type: "string",
            enum: ["FRA", "SEN", "BRA", "ENG", "MEX"],
          },
          date: { type: "string", description: "ISO date YYYY-MM-DD" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_fan_gatherings",
      description:
        "Find ranked watch spots and live events for a team. Use for 'where are fans watching' questions.",
      parameters: {
        type: "object",
        properties: {
          team: {
            type: "string",
            enum: ["FRA", "SEN", "BRA", "ENG", "MEX"],
          },
          intent: {
            type: "string",
            enum: ["party", "quiet", "authentic", "survival"],
          },
          matchId: { type: "string" },
          commentaryLanguage: { type: "string" },
        },
        required: ["team"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_watch_contract",
      description:
        "Build a Watch Contract: primary venue, contrasting backup, arrive-by time, and optional route.",
      parameters: {
        type: "object",
        properties: {
          matchId: { type: "string" },
          team: {
            type: "string",
            enum: ["FRA", "SEN", "BRA", "ENG", "MEX"],
          },
          intent: {
            type: "string",
            enum: ["party", "quiet", "authentic", "survival"],
          },
          includeRoute: { type: "boolean" },
          avoidTransitHubs: { type: "boolean" },
          commentaryLanguage: { type: "string" },
        },
        required: ["matchId", "team", "intent"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "plan_route",
      description: "Plan transit from fan origin to a destination lat/lng.",
      parameters: {
        type: "object",
        properties: {
          toLat: { type: "number" },
          toLng: { type: "number" },
          destinationLabel: { type: "string" },
          mode: { type: "string", enum: ["transit", "driving", "walking"] },
        },
        required: ["toLat", "toLng"],
      },
    },
  },
];

interface AgentSideEffects {
  places: GatheringPlace[];
  recommendation?: ChatRecommendation;
  showRouteToMatch?: boolean;
  updatedAt?: string;
}

function buildSystemPrompt(prefs: UserPreferences): string {
  const intent = intentFromCrowd(prefs.crowd);
  return `You are Match Day — a World Cup 2026 fan travel assistant for the NYC/NJ metro.

Rules:
- ONLY recommend venues and events returned by your tools. Never invent bars or watch parties.
- When a user asks where to watch, call find_fan_gatherings or get_watch_contract first.
- For match-day transit, call plan_route to the stadium/venue coordinates.
- Present results as a friendly **Watch Contract**: primary pick, backup, arrive-by, and transit notes.
- Mention confidence honestly (confirmed > community > likely > backup).
- Warn about Penn Station crush for MetLife routes; prefer Secaucus Junction.
- Keep replies concise (under ~180 words) with markdown bold for venue names and times.
- If the user switches teams in conversation, use the new team in tool calls.

Current fan profile:
- Team: ${prefs.team}
- Vibe intent: ${intent} (crowd slider ${prefs.crowd}/100)
- Origin: ${prefs.originLabel} (${FAN_ORIGIN.lat}, ${FAN_ORIGIN.lng})
- Max travel: ${prefs.maxTravelMin} min
- Accessible only: ${prefs.accessibleOnly}
- Native-language commentary preferred: ${prefs.nativeLanguage}`;
}

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  repo: Repo,
  prefs: UserPreferences,
  effects: AgentSideEffects
): Promise<string> {
  const lang = commentaryLanguageFor(prefs);

  switch (name) {
    case "get_matches": {
      const team = args.team as TeamCode | undefined;
      const date = typeof args.date === "string" ? args.date : undefined;
      const matches = await repo.getMatches({ team, date });
      return JSON.stringify(
        matches.slice(0, 8).map((m) => ({
          id: m.id,
          home: m.homeTeam,
          away: m.awayTeam,
          venueName: m.venueName,
          kickoff: m.kickoff,
          stage: m.stage,
          lat: m.venue.lat,
          lng: m.venue.lng,
        }))
      );
    }

    case "find_fan_gatherings": {
      const team = (args.team as TeamCode) ?? (prefs.team as TeamCode);
      const intent =
        (args.intent as Intent | undefined) ?? intentFromCrowd(prefs.crowd);
      const result = await findFanGatherings(
        {
          team,
          matchId: typeof args.matchId === "string" ? args.matchId : undefined,
          fanLocation: FAN_ORIGIN,
          intent,
          commentaryLanguage:
            typeof args.commentaryLanguage === "string"
              ? args.commentaryLanguage
              : lang,
          avoidTransitHubs: prefs.accessibleOnly,
        },
        repo
      );
      const places = result.venues.map(scoredVenueToPlace);
      effects.places = places;
      effects.updatedAt = result.lastUpdated ?? new Date().toISOString();
      return JSON.stringify({
        team: result.team,
        lastUpdated: result.lastUpdated,
        events: result.events.slice(0, 5).map((e) => ({
          title: e.title,
          venueName: e.venueName,
          startTime: e.startTime,
          confidence: e.confidence,
          source: e.source,
        })),
        venues: summarizeVenues(places),
      });
    }

    case "get_watch_contract": {
      const matchId = String(args.matchId ?? "");
      const team = (args.team as TeamCode) ?? (prefs.team as TeamCode);
      const intent =
        (args.intent as Intent | undefined) ?? intentFromCrowd(prefs.crowd);
      const includeRoute = args.includeRoute !== false;

      const contract = await assembleWatchContract(
        {
          matchId,
          team,
          intent,
          fanLocation: FAN_ORIGIN,
          commentaryLanguage:
            typeof args.commentaryLanguage === "string"
              ? args.commentaryLanguage
              : lang,
          avoidTransitHubs:
            args.avoidTransitHubs === true || prefs.accessibleOnly,
        },
        repo
      );

      if (includeRoute) {
        contract.route = await planRoute({
          from: FAN_ORIGIN,
          to: contract.primary.venue.location,
          mode: "transit",
        });
      }

      const places = [
        scoredVenueToPlace(contract.primary),
        scoredVenueToPlace(contract.backup),
      ];
      effects.places = places;
      effects.recommendation = contractToRecommendation(contract, prefs);
      effects.updatedAt = contract.generatedAt;
      return JSON.stringify(summarizeContract(contract));
    }

    case "plan_route": {
      const toLat = Number(args.toLat);
      const toLng = Number(args.toLng);
      const mode =
        args.mode === "driving" || args.mode === "walking"
          ? args.mode
          : "transit";
      const plan = await planRoute({
        from: FAN_ORIGIN,
        to: { lat: toLat, lng: toLng },
        mode,
      });

      const matches = await repo.getMatches({ team: prefs.team as TeamCode });
      const nearMatch = matches.some(
        (m) =>
          Math.abs(m.venue.lat - toLat) < 0.02 &&
          Math.abs(m.venue.lng - toLng) < 0.02
      );
      const label =
        typeof args.destinationLabel === "string"
          ? args.destinationLabel.toLowerCase()
          : "";
      if (
        nearMatch ||
        label.includes("metlife") ||
        label.includes("stadium") ||
        label.includes("match")
      ) {
        effects.showRouteToMatch = true;
      }

      return JSON.stringify({
        durationMin: plan.durationMin,
        distanceKm: plan.distanceKm,
        warnings: plan.warnings,
        mode: plan.mode,
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

export async function runGroqAgent(
  message: string,
  prefs: UserPreferences,
  repo: Repo,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<AgentChatResult> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const effects: AgentSideEffects = { places: [] };

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(prefs) },
    ...history.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.4,
      max_tokens: 800,
    });

    const choice = completion.choices[0]?.message;
    if (!choice) {
      throw new Error("Groq returned no message");
    }

    messages.push(choice);

    const toolCalls = choice.tool_calls;
    if (!toolCalls?.length) {
      const content = choice.content?.trim();
      if (!content) throw new Error("Groq returned empty content");
      return {
        content,
        places: effects.places,
        recommendation: effects.recommendation,
        showRouteToMatch: effects.showRouteToMatch,
        updatedAt: effects.updatedAt,
      };
    }

    for (const call of toolCalls) {
      const fn = call.function;
      let parsed: Record<string, unknown> = {};
      try {
        parsed = fn.arguments ? JSON.parse(fn.arguments) : {};
      } catch {
        parsed = {};
      }
      const result = await executeTool(fn.name, parsed, repo, prefs, effects);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  throw new Error("Groq agent exceeded max tool rounds");
}
