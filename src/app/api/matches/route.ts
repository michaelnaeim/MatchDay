import type { NextRequest } from "next/server";
import { getRepo } from "@/services/repo";
import {
  ok,
  fail,
  parseTeam,
  TEAM_CODES,
} from "@/lib/api";
import type { TeamCode } from "@/types";

// GET /api/matches?team=FRA&date=2026-06-16
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const teamParam = params.get("team");
    const date = params.get("date") ?? undefined;

    let team: TeamCode | undefined;
    if (teamParam) team = parseTeam(teamParam);

    const repo = getRepo();
    const matches = await repo.getMatches({ team, date });
    return ok({ matches, teams: TEAM_CODES });
  } catch (err) {
    return fail(err);
  }
}
