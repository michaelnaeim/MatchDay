import type { NextRequest } from "next/server";
import { getRepo } from "@/services/repo";
import { findFanGatherings } from "@/services/gatherings_service";
import {
  ok,
  fail,
  parseTeam,
  parseIntent,
  parseLatLngParam,
} from "@/lib/api";

// GET /api/gatherings?team=FRA&matchId=...&loc=40.74,-74.0&intent=party&lang=French&avoidHubs=true
export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const team = parseTeam(p.get("team"));
    const matchId = p.get("matchId") ?? undefined;
    const fanLocation = parseLatLngParam(p.get("loc"), "loc");
    const intent = p.get("intent")
      ? parseIntent(p.get("intent"))
      : undefined;
    const commentaryLanguage = p.get("lang") ?? undefined;
    const avoidTransitHubs = p.get("avoidHubs") === "true";

    const result = await findFanGatherings(
      {
        team,
        matchId,
        fanLocation,
        intent,
        commentaryLanguage,
        avoidTransitHubs,
      },
      getRepo(),
    );
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}
