"use client";

import type { Match } from "@/lib/types";
import { formatKickoff } from "@/lib/labels";
import { Calendar, MapPin, AlertTriangle } from "lucide-react";

interface MatchBannerProps {
  match: Match | null;
  teamFlag: string;
  teamName: string;
}

export default function MatchBanner({
  match,
  teamFlag,
  teamName,
}: MatchBannerProps) {
  if (!match) {
    return (
      <div className="rounded-xl border border-pitch-700/80 bg-pitch-800/40 px-4 py-3 text-sm text-white/50">
        No match today for {teamName} in our schedule — showing usual fan spots.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent-gold/30 bg-gradient-to-r from-accent-gold/10 to-transparent px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-display text-white font-medium flex items-center gap-2">
          {teamFlag} Match day
        </span>
        <span className="text-white/60 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatKickoff(match.kickoff)}
        </span>
        <span className="text-white/60 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {match.venueName}
        </span>
      </div>
      <p className="mt-2 text-xs text-white/45 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-accent-gold shrink-0" />
        Penn Station corridor busy 5:30–9pm on MetLife match days — routes avoid it when possible.
      </p>
    </div>
  );
}
