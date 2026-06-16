import type { HeatSource } from "./heatmap";

/** Unified cool palette — no red/orange source badges */
export const SOURCE_COLORS: Record<HeatSource, string> = {
  eventbrite: "#6554ff",
  luma: "#0ea5e9",
  reddit: "#6366f1",
  ics: "#8b5cf6",
  curated: "#64748b",
};

export const SOURCE_LABELS: Record<HeatSource, string> = {
  eventbrite: "Eventbrite",
  luma: "Luma",
  reddit: "Reddit",
  ics: "Calendar",
  curated: "Curated",
};

/** Venue crowd — teal/purple/amber instead of red */
export const CROWD_PIN_COLORS = {
  high: "#6554ff",
  medium: "#0ea5e9",
  low: "#12b886",
} as const;

export const ROUTE_ORIGIN: [number, number] = [40.7465, -74.0014];
