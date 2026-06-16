"use client";

import { TEAMS } from "@/lib/mock-data";
import type { VibeIntent } from "@/lib/types";
import { MapPin, Users, Volume2, VolumeX, Sparkles } from "lucide-react";

interface FilterBarProps {
  team: string;
  intent: VibeIntent;
  onTeamChange: (code: string) => void;
  onIntentChange: (intent: VibeIntent) => void;
}

const INTENTS: { id: VibeIntent; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All spots", icon: <MapPin className="w-3.5 h-3.5" /> },
  { id: "party", label: "Crowded / party", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "authentic", label: "Authentic fans", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: "quiet", label: "Quiet / low crowd", icon: <VolumeX className="w-3.5 h-3.5" /> },
];

export default function FilterBar({
  team,
  intent,
  onTeamChange,
  onIntentChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
          Your team
        </p>
        <div className="flex flex-wrap gap-2">
          {TEAMS.map((t) => (
            <button
              key={t.code}
              type="button"
              onClick={() => onTeamChange(t.code)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                team === t.code
                  ? "bg-white/10 border-accent-gold text-white shadow-glow"
                  : "bg-pitch-800/60 border-pitch-700 text-white/60 hover:border-pitch-600 hover:text-white/80"
              }`}
            >
              <span>{t.flag}</span>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
          Crowd & vibe
        </p>
        <div className="grid grid-cols-2 gap-2">
          {INTENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onIntentChange(item.id)}
              className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all border ${
                intent === item.id
                  ? "bg-accent-live/15 border-accent-live/50 text-white"
                  : "bg-pitch-800/60 border-pitch-700 text-white/60 hover:border-pitch-600"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-white/35 flex items-start gap-1.5">
        <Volume2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Live events from Eventbrite, Luma & community sources refresh every 30 min.
      </p>
    </div>
  );
}
