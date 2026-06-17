import type { NextRequest } from "next/server";
import { getRepo } from "@/services/repo";
import { assembleWatchContract } from "@/services/watch_contract";
import { planRoute } from "@/services/routing_service";
import {
  ok,
  fail,
  parseTeam,
  parseIntent,
  parseLatLng,
  ApiError,
} from "@/lib/api";

// POST /api/watch-contract
// body: { matchId, fanLocation:{lat,lng}, team, intent,
//         commentaryLanguage?, avoidTransitHubs?, includeRoute? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.");
    });

    const matchId = body.matchId;
    if (typeof matchId !== "string" || !matchId) {
      throw new ApiError("matchId is required.");
    }
    const team = parseTeam(body.team);
    const intent = parseIntent(body.intent);
    const fanLocation = parseLatLng(body.fanLocation, "fanLocation");
    const commentaryLanguage =
      typeof body.commentaryLanguage === "string"
        ? body.commentaryLanguage
        : undefined;
    const avoidTransitHubs = body.avoidTransitHubs === true;
    const includeRoute = body.includeRoute === true;

    const repo = getRepo();

    // Build the contract first (also validates the match exists).
    const contract = await assembleWatchContract(
      { matchId, fanLocation, team, intent, commentaryLanguage, avoidTransitHubs },
      repo,
    );

    // Optionally attach a route to the primary venue (degrades gracefully).
    if (includeRoute) {
      contract.route = await planRoute({
        from: fanLocation,
        to: contract.primary.venue.location,
        mode: "transit",
      });
    }

    return ok(contract);
  } catch (err) {
    return fail(err);
  }
}
