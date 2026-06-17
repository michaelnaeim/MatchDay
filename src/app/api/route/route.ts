import type { NextRequest } from "next/server";
import { planRoute } from "@/services/routing_service";
import { ok, fail, parseLatLng, ApiError } from "@/lib/api";
import type { TravelMode } from "@/types";

const MODES: TravelMode[] = ["transit", "driving", "walking"];

// POST /api/route
// body: { from:{lat,lng}, to:{lat,lng}, mode? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.");
    });

    const from = parseLatLng(body.from, "from");
    const to = parseLatLng(body.to, "to");
    const mode: TravelMode = MODES.includes(body.mode) ? body.mode : "transit";

    const plan = await planRoute({ from, to, mode });
    return ok(plan);
  } catch (err) {
    return fail(err);
  }
}
