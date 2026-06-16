"use client";

import dynamic from "next/dynamic";
import type { GatheringPlace, Match } from "@/lib/types";
import type { MapPulse } from "@/lib/live-map";
import type { MatchTransitPlan } from "@/lib/match-route";
import { formatUpdatedAt } from "@/lib/labels";
import { Navigation, Radio } from "lucide-react";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#0a0c14] animate-pulse flex items-center justify-center text-white/30 text-sm">
      Loading map…
    </div>
  ),
});

interface MapPanelProps {
  places: GatheringPlace[];
  match: Match | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  center: [number, number];
  pulses?: MapPulse[];
  liveUpdatedAt?: string;
  routeMode?: boolean;
  matchTransit?: MatchTransitPlan | null;
  onRouteToMatch?: () => void;
  mounted?: boolean;
}

export default function MapPanel({
  routeMode = false,
  matchTransit,
  onRouteToMatch,
  pulses = [],
  liveUpdatedAt,
  mounted = true,
  ...props
}: MapPanelProps) {
  return (
    <div className="relative flex flex-col h-full min-h-0 rounded-xl overflow-hidden border border-white/[0.06] bg-[#0a0c14]">
      <div className="relative flex-1 min-h-0">
        {!mounted ? (
          <div className="h-full w-full bg-[#0a0c14] animate-pulse flex items-center justify-center text-white/30 text-sm">
            Loading map…
          </div>
        ) : (
          <MapView
            {...props}
            pulses={pulses}
            routeMode={routeMode}
            matchTransit={matchTransit}
          />
        )}

        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border border-white/10 text-[11px] text-white font-medium backdrop-blur-md">
            <Radio className="w-3 h-3 text-[#F5C518] animate-pulse" />
            Live map
            {liveUpdatedAt && (
              <span className="text-white/50 font-normal">· {formatUpdatedAt(liveUpdatedAt)}</span>
            )}
          </span>
          {routeMode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6366f1] text-[11px] text-white font-semibold">
              <Navigation className="w-3 h-3" />
              Route active
            </span>
          )}
        </div>

        {props.match && onRouteToMatch && !routeMode && (
          <button
            type="button"
            onClick={onRouteToMatch}
            className="absolute top-3 right-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5C518] text-[#050508] text-[11px] font-semibold shadow-glow hover:brightness-110 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Get to match
          </button>
        )}

        {routeMode && matchTransit && (
          <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none">
            <div className="pointer-events-auto rounded-xl bg-[#111827]/95 border border-white/10 shadow-panel p-3 max-w-sm backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a5b4fc]">
                Route to match
              </p>
              <p className="text-xs text-white/60 mt-1">
                Leave <strong className="text-[#F5C518]">{matchTransit.leaveBy}</strong> · ~
                {matchTransit.durationMin} min
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
