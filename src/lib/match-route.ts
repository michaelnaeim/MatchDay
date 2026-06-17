import type { Match } from "./types";

export interface MatchTransitPlan {
  leaveBy: string;
  durationMin: number;
  summary: string;
  steps: string[];
  warning?: string;
}

/** Waypoints Chelsea → Penn → Secaucus → MetLife */
export const MATCH_ROUTE: [number, number][] = [
  [40.7465, -74.0014],
  [40.7505, -73.9934],
  [40.769, -74.02],
  [40.7892, -74.0561],
  [40.8135, -74.0745],
];

export function planTransitToMatch(match: Match | null): MatchTransitPlan {
  return {
    leaveBy: "5:25 PM",
    durationMin: 48,
    summary: "Chelsea → MetLife Stadium",
    steps: [
      "Walk to 14 St–Union Sq (8 min)",
      "N/Q/R/W to 34 St, then NJ Transit from Penn Station (22 min)",
      "Secaucus transfer or Meadowlands bus to stadium corridor (12 min)",
      "Walk to gate — arrive by 6:45 PM for France vs Senegal",
    ],
    warning:
      match?.venueName === "MetLife Stadium"
        ? "Skip Penn main concourse 5:30–7pm. Prefer Port Authority bus or PATH → Hoboken → Secaucus."
        : undefined,
  };
}

export function isTransitQuery(message: string): boolean {
  const m = message.toLowerCase();
  return (
    /how do i get|get to the match|get to the stadium|get to metlife|directions|transit|route|stadium|leave by|path|nj transit|how to go/.test(
      m
    ) && !/watch party|where.*watch|fan|gathering/.test(m)
  );
}
