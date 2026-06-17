import { NextResponse } from "next/server";
import type { Intent, LatLng, TeamCode } from "@/types";

// Small, dependency-free request helpers shared by the API routes.

export const TEAM_CODES: TeamCode[] = ["FRA", "SEN", "BRA", "ENG", "MEX"];
export const INTENTS: Intent[] = ["party", "quiet", "authentic", "survival"];

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function parseTeam(value: unknown): TeamCode {
  if (typeof value === "string" && TEAM_CODES.includes(value as TeamCode)) {
    return value as TeamCode;
  }
  throw new ApiError(`Invalid team. Expected one of ${TEAM_CODES.join(", ")}.`);
}

export function parseIntent(value: unknown, fallback?: Intent): Intent {
  if (typeof value === "string" && INTENTS.includes(value as Intent)) {
    return value as Intent;
  }
  if (fallback) return fallback;
  throw new ApiError(`Invalid intent. Expected one of ${INTENTS.join(", ")}.`);
}

export function parseLatLng(value: unknown, field = "location"): LatLng {
  if (
    value &&
    typeof value === "object" &&
    typeof (value as LatLng).lat === "number" &&
    typeof (value as LatLng).lng === "number"
  ) {
    const { lat, lng } = value as LatLng;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new ApiError(`${field} out of range.`);
    }
    return { lat, lng };
  }
  throw new ApiError(`${field} must be { lat, lng }.`);
}

/** Parse "lat,lng" query string into a LatLng (or undefined if absent). */
export function parseLatLngParam(
  param: string | null,
  field = "location",
): LatLng | undefined {
  if (!param) return undefined;
  const [lat, lng] = param.split(",").map((n) => Number(n.trim()));
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ApiError(`${field} must be "lat,lng".`);
  }
  return parseLatLng({ lat, lng }, field);
}
