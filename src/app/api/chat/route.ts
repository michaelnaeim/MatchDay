import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_PREFS,
  generateChatReply,
  detectTeam,
  type UserPreferences,
} from "@/lib/chat-engine";
import { backendMatchToUI, scoredVenueToPlace } from "@/lib/venue-mapper";
import { getRepo } from "@/services/repo";
import { findFanGatherings } from "@/services/gatherings_service";
import { isGroqConfigured, runGroqAgent } from "@/services/agent_service";
import { isTransitQuery, planTransitToMatch } from "@/lib/match-route";
import type { Intent } from "@/types";

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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const message = String(body.message ?? "").trim();
  let prefs: UserPreferences = { ...DEFAULT_PREFS, ...body.prefs };
  const history = Array.isArray(body.history)
    ? body.history.filter(
        (m: unknown) =>
          m &&
          typeof m === "object" &&
          (m as { role?: string }).role &&
          typeof (m as { content?: unknown }).content === "string"
      )
    : [];

  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const detected = detectTeam(message);
  let teamChanged = false;
  if (detected && detected !== prefs.team) {
    prefs = { ...prefs, team: detected };
    teamChanged = true;
  }

  const repo = getRepo();

  if (isGroqConfigured()) {
    try {
      const agent = await runGroqAgent(message, prefs, repo, history);
      return NextResponse.json({
        message: {
          id: crypto.randomUUID(),
          role: "assistant",
          content: agent.content,
          recommendation: agent.recommendation,
          suggestedPlaceIds: agent.places.slice(0, 4).map((p) => p.id),
          showRouteToMatch: agent.showRouteToMatch,
        },
        places: agent.places,
        newPrefs: teamChanged ? prefs : undefined,
        updatedAt: agent.updatedAt ?? new Date().toISOString(),
      });
    } catch (err) {
      console.error("Groq agent error, falling back to rules engine:", err);
    }
  }

  if (isTransitQuery(message)) {
    const matches = await repo.getMatches({ team: prefs.team as any });
    const now = Date.now();
    const match =
      matches
        .filter((m) => new Date(m.kickoff).getTime() >= now)
        .sort(
          (a, b) =>
            new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
        )[0] ?? matches[0];

    if (match) {
      const uiMatch = backendMatchToUI(match);
      const transit = planTransitToMatch(uiMatch);
      let content = `**Route to ${uiMatch.venueName}** from ${prefs.originLabel}\n\n`;
      if (teamChanged) {
        content = `Switching to **${prefs.team}** fans. ` + content;
      }
      content += `Leave by **${transit.leaveBy}** (~${transit.durationMin} min).\n\n`;
      content += transit.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
      if (transit.warning) content += `\n\n⚠️ ${transit.warning}`;
      content += `\n\nTap **Get to the match** on the map — the yellow route is pinned for you.`;

      return NextResponse.json({
        message: {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          showRouteToMatch: true,
        },
        places: [],
        newPrefs: teamChanged ? prefs : undefined,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  try {
    const intent = intentFromCrowd(prefs.crowd);

    const [gatheringsResult, matches] = await Promise.all([
      findFanGatherings(
        {
          team: prefs.team as any,
          fanLocation: { lat: 40.7465, lng: -74.0014 },
          intent,
          commentaryLanguage: commentaryLanguageFor(prefs),
        },
        repo
      ),
      repo.getMatches({ team: prefs.team as any }),
    ]);

    const places = gatheringsResult.venues.map(scoredVenueToPlace);
    const primary = places[0];
    const backup = places.find(
      (p) => p.id !== primary?.id && p.crowdLevel !== primary?.crowdLevel
    );

    const now = Date.now();
    const upcoming = matches
      .filter((m) => new Date(m.kickoff).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );
    const match = upcoming[0] ?? matches[0];

    if (!primary) {
      return NextResponse.json({
        message: {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I couldn't find a spot for that team yet. Try another team or widen your travel time slider.",
        },
        places: [],
        newPrefs: teamChanged ? prefs : undefined,
        updatedAt: new Date().toISOString(),
      });
    }

    const crowdWord =
      prefs.crowd < 30 ? "quieter" : prefs.crowd > 70 ? "high-energy" : "balanced";

    let content = teamChanged ? `Switching to **${prefs.team}** fans. ` : "";
    content += `Here's your **Watch Contract** for ${prefs.team} fans — powered by real venue scoring.\n\n`;
    content += `**Primary — ${primary.name}** (${primary.neighborhood})\n`;
    content += `${primary.description}\n`;
    content += `Confidence: **${primary.confidence}** · ${primary.source}\n\n`;

    if (backup) {
      content += `**Backup — ${backup.name}** (${backup.neighborhood}, ${backup.crowdLevel === "low" ? "quieter" : "moderate"}).\n\n`;
    }

    if (primary.arriveBy) {
      content += `Arrive by **${primary.arriveBy}**\n`;
    }

    content += `\nI tuned this for **${crowdWord}** vibes based on your sliders. Scoring uses real diaspora density + live events.`;

    return NextResponse.json({
      message: {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        recommendation: backup
          ? {
              primary,
              backup,
              transit: {
                leaveBy: "5:35 PM",
                durationMin: 22,
                summary: `Chelsea → ${primary.neighborhood}`,
                steps: [
                  "Walk to 14 St–Union Sq (8 min)",
                  "Local train (~10 min)",
                  "Walk to venue (4 min)",
                ],
              },
            }
          : undefined,
        suggestedPlaceIds: places.slice(0, 4).map((p) => p.id),
      },
      places,
      newPrefs: teamChanged ? prefs : undefined,
      updatedAt: gatheringsResult.lastUpdated ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error("Chat backend error, falling back to mock:", err);
    await new Promise((r) => setTimeout(r, 400));
    const { reply, ranked } = generateChatReply(message, prefs);
    return NextResponse.json({
      message: reply,
      places: ranked,
      newPrefs: teamChanged ? prefs : undefined,
      updatedAt: new Date().toISOString(),
    });
  }
}
