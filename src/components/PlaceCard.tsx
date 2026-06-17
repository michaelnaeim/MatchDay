"use client";

import type { GatheringPlace } from "@/lib/types";
import {
  CROWD_COLORS,
  CROWD_LABELS,
  CONFIDENCE_LABELS,
  SOURCE_LABELS,
} from "@/lib/labels";
import {
  ExternalLink,
  Accessibility,
  Clock,
  MapPin,
  Languages,
} from "lucide-react";

interface PlaceCardProps {
  place: GatheringPlace;
  selected: boolean;
  onSelect: () => void;
}

export default function PlaceCard({
  place,
  selected,
  onSelect,
}: PlaceCardProps) {
  const crowdColor = CROWD_COLORS[place.crowdLevel];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        selected
          ? "bg-white/8 border-accent-gold/60 shadow-glow"
          : "bg-pitch-800/40 border-pitch-700/80 hover:border-pitch-600 hover:bg-pitch-800/70"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm text-white leading-snug pr-2">
          {place.name}
        </h3>
        <span
          className="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${crowdColor}22`,
            color: crowdColor,
            border: `1px solid ${crowdColor}55`,
          }}
        >
          {CROWD_LABELS[place.crowdLevel]}
        </span>
      </div>

      <p className="text-xs text-white/50 flex items-center gap-1 mb-2">
        <MapPin className="w-3 h-3" />
        {place.neighborhood}
      </p>

      <p className="text-xs text-white/65 line-clamp-2 mb-3">{place.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge>{CONFIDENCE_LABELS[place.confidence]}</Badge>
        <Badge>{SOURCE_LABELS[place.source]}</Badge>
        {place.adaAccessible && (
          <Badge icon={<Accessibility className="w-3 h-3" />}>Accessible</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-white/45">
        {place.arriveBy && (
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Arrive by {place.arriveBy}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Languages className="w-3 h-3" />
          {place.languages.join(", ").toUpperCase()}
        </span>
      </div>

      {place.sourceUrl && selected && (
        <a
          href={place.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 inline-flex items-center gap-1 text-xs text-accent-live hover:underline"
        >
          View on {SOURCE_LABELS[place.source]}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </button>
  );
}

function Badge({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pitch-700/60 text-[10px] text-white/55 border border-pitch-600/50">
      {icon}
      {children}
    </span>
  );
}
