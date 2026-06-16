"use client";

import type { ChatRecommendation } from "@/lib/chat-engine";
import { CROWD_COLORS, CROWD_LABELS, SOURCE_LABELS } from "@/lib/labels";
import { Bus, Clock, MapPin, Navigation, AlertTriangle } from "lucide-react";

interface RecommendationCardProps {
  rec: ChatRecommendation;
  onSelectPlace: (id: string) => void;
}

export default function RecommendationCard({
  rec,
  onSelectPlace,
}: RecommendationCardProps) {
  const { primary, backup, transit } = rec;

  return (
    <div className="mt-4 space-y-2.5 text-left">
      <button
        type="button"
        onClick={() => onSelectPlace(primary.id)}
        className="w-full rounded-xl border-2 border-[#F5C518]/50 bg-[#F5C518]/10 p-4 hover:bg-[#F5C518]/15 transition-colors text-left"
      >
        <p className="text-[10px] uppercase tracking-wider text-[#F5C518] font-bold mb-1">
          Primary pick · pin on map
        </p>
        <p className="font-semibold text-base text-white">{primary.name}</p>
        <p className="text-sm text-white/55 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          {primary.neighborhood}
        </p>
        <span
          className="inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${CROWD_COLORS[primary.crowdLevel]}22`,
            color: CROWD_COLORS[primary.crowdLevel],
          }}
        >
          {CROWD_LABELS[primary.crowdLevel]}
        </span>
      </button>

      {backup && (
        <button
          type="button"
          onClick={() => onSelectPlace(backup.id)}
          className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3.5 hover:border-white/25 transition-all text-left"
        >
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">
            Backup
          </p>
          <p className="font-medium text-sm text-white">{backup.name}</p>
          <p className="text-xs text-white/50">{backup.neighborhood}</p>
        </button>
      )}

      <div className="rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/10 p-3.5">
        <p className="text-[10px] uppercase tracking-wider text-[#a5b4fc] font-bold mb-2 flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5" />
          Transit plan
        </p>
        <p className="text-sm text-white font-medium">{transit.summary}</p>
        <p className="text-xs text-white/55 flex items-center gap-2 mt-2">
          <Clock className="w-3.5 h-3.5" />
          Leave by {transit.leaveBy} · ~{transit.durationMin} min
        </p>
        <ol className="mt-2 space-y-1.5">
          {transit.steps.map((step, i) => (
            <li
              key={i}
              className="text-xs text-white/60 flex items-start gap-2"
            >
              <Bus className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/40" />
              {step}
            </li>
          ))}
        </ol>
        {transit.warning && (
          <p className="mt-2 text-xs text-[#F5C518] flex items-start gap-1.5 bg-[#F5C518]/10 rounded-lg p-2.5 border border-[#F5C518]/20">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {transit.warning}
          </p>
        )}
      </div>

      {primary.sourceUrl && (
        <a
          href={primary.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#a5b4fc] font-medium hover:underline"
        >
          View on {SOURCE_LABELS[primary.source]}
        </a>
      )}
    </div>
  );
}
