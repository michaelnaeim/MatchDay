import type { Confidence, CrowdLevel, EventSource } from "./types";

export const CROWD_LABELS: Record<CrowdLevel, string> = {
  high: "Crowded / party",
  medium: "Moderate",
  low: "Quiet / low crowd",
};

export const CROWD_COLORS: Record<CrowdLevel, string> = {
  high: "#6554ff",
  medium: "#0ea5e9",
  low: "#12b886",
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  confirmed: "Confirmed event",
  likely: "Likely fan spot",
  community: "Community tip",
  backup: "Quiet backup",
};

export const SOURCE_LABELS: Record<EventSource, string> = {
  eventbrite: "Eventbrite",
  luma: "Luma",
  ics: "Calendar",
  reddit: "Reddit",
  curated: "Curated",
};

export function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
