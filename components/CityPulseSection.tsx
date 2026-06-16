"use client";

import { useEffect, useState } from "react";
import {
  getPulseZones,
  jitterPulse,
  type LivePulseZone,
} from "@/lib/live-simulation";

interface CityPulseSectionProps {
  teamCode?: string;
  onZoneSelect?: (venueId: string) => void;
}

export default function CityPulseSection({
  teamCode = "FRA",
  onZoneSelect,
}: CityPulseSectionProps) {
  const [pulse, setPulse] = useState<LivePulseZone[]>(() =>
    getPulseZones(teamCode)
  );
  const [highlightZone, setHighlightZone] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    setPulse(getPulseZones(teamCode));
  }, [teamCode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => setPulse((p) => jitterPulse(p)), 3500);
    return () => clearInterval(t);
  }, [mounted]);

  const handleZoneClick = (zone: LivePulseZone) => {
    setHighlightZone(zone.id);
    if (zone.venueId && onZoneSelect) onZoneSelect(zone.venueId);
    setTimeout(() => setHighlightZone(null), 1800);
  };

  if (!mounted) {
    return <div className="h-48 rounded-2xl bg-premium-card animate-pulse" />;
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0c14] p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
          City pulse
        </h3>
        <span className="text-[10px] text-white/25">Tap → map</span>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scroll space-y-2 min-h-0">
        {pulse.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => handleZoneClick(zone)}
            className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
              highlightZone === zone.id
                ? "border-[#F5C518]/50 bg-[#F5C518]/10 scale-[1.01]"
                : "border-white/[0.06] bg-[#111827]/80 hover:border-white/12"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium text-white flex items-center gap-2 truncate">
                <span>{zone.emoji}</span>
                {zone.name}
              </span>
              <span className="text-xs font-bold tabular-nums text-white/50">
                {zone.intensity}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${zone.intensity}%`,
                  background:
                    zone.team === "SEN"
                      ? "linear-gradient(90deg, #16a34a, #4ade80)"
                      : zone.team === "FRA"
                        ? "linear-gradient(90deg, #2563eb, #60a5fa)"
                        : "linear-gradient(90deg, #F5C518, #fde047)",
                }}
              />
            </div>
            <p className="text-[10px] text-white/35 mt-1.5 truncate">
              {zone.label}
              {zone.trend === "surge" && (
                <span className="ml-1 text-[#FF6B6B] font-semibold">SURGE</span>
              )}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
