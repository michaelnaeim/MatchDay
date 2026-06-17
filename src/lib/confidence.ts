import type { ConfidenceLevel, RecommendationSource } from "@/types";

// Single source of truth for how confidence is shown. Honest ladder:
// confirmed > community > likely > backup.

export const CONFIDENCE_META: Record<
  ConfidenceLevel,
  { label: string; hex: string; text: string; bg: string; explain: string }
> = {
  confirmed: {
    label: "Confirmed",
    hex: "#22c55e",
    text: "text-confirmed",
    bg: "bg-confirmed/15 text-confirmed ring-1 ring-confirmed/40",
    explain: "A real, scheduled watch party from a live/seed source.",
  },
  community: {
    label: "Community",
    hex: "#0ea5e9",
    text: "text-community",
    bg: "bg-community/15 text-community ring-1 ring-community/40",
    explain: "Reported by the community (e.g. Reddit) — likely but unofficial.",
  },
  likely: {
    label: "Likely",
    hex: "#f59e0b",
    text: "text-likely",
    bg: "bg-likely/15 text-likely ring-1 ring-likely/40",
    explain: "A tagged venue for this team — a good bet, but no confirmed event.",
  },
  backup: {
    label: "Backup",
    hex: "#999999",
    text: "text-backup",
    bg: "bg-backup/15 text-backup ring-1 ring-backup/40",
    explain: "A fallback option, inferred from diaspora geography.",
  },
};

export const SOURCE_LABEL: Record<RecommendationSource, string> = {
  "live-event": "Live event",
  "tagged-venue": "Tagged venue",
  "diaspora-inferred": "Diaspora-inferred",
};
