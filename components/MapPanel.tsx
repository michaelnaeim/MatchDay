"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { GatheringPlace, Match } from "@/lib/types";
import type { LiveMapResponse } from "@/lib/live-map";
import type { MatchTransitPlan } from "@/lib/match-route";
import { formatUpdatedAt } from "@/lib/labels";
import LiveWire from "./LiveWire";
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
  teamCode?: string;
  routeMode?: boolean;
  matchTransit?: MatchTransitPlan | null;
  onRouteToMatch?: () => void;
}

export default function MapPanel({
  teamCode = "FRA",
  routeMode = false,
  matchTransit,
  onRouteToMatch,
  ...props
}: MapPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [live, setLive] = useState<LiveMapResponse | null>(null);
  const [heatTick, setHeatTick] = useState(0);

  const loadLive = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-map?team=${teamCode}`);
      if (!res.ok) return;
      const data: LiveMapResponse = await res.json();
      setLive(data);
      setHeatTick((t) => t + 1);
    } catch {
      /* keep last */
    }
  }, [teamCode]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    loadLive();
    const t = setInterval(loadLive, 8000);
    return () => clearInterval(t);
  }, [mounted, loadLive]);

  return (
    <div className="relative flex flex-col h-full min-h-[480px] lg:min-h-[560px] flex-1 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0c14] shadow-panel-lg">
      <div className="relative flex-1 min-h-[360px]">
        {!mounted ? (
          <div className="h-full w-full bg-[#0a0c14] animate-pulse flex items-center justify-center text-white/30 text-sm">
            Loading map…
          </div>
        ) : (
          <MapView
            {...props}
            pulses={live?.pulses}
            routeMode={routeMode}
            matchTransit={matchTransit}
            heatTick={heatTick}
          />
        )}

        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border border-white/10 text-[11px] text-white font-medium backdrop-blur-md">
            <Radio className="w-3 h-3 text-[#F5C518] animate-pulse" />
            Live heatmap
            {live && (
              <span className="text-white/50 font-normal">
                · {formatUpdatedAt(live.updatedAt)}
              </span>
            )}
          </span>
          {routeMode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-miro-purple text-[11px] text-white font-semibold shadow-miro">
              <Navigation className="w-3 h-3" />
              Route active
            </span>
          )}
        </div>

        {props.match && onRouteToMatch && !routeMode && (
          <button
            type="button"
            onClick={onRouteToMatch}
            className="absolute top-3 right-3 z-[1000] flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5C518] text-[#050508] text-[12px] font-semibold shadow-glow hover:brightness-110 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Get to the match
          </button>
        )}

        {routeMode && matchTransit && (
          <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none">
            <div className="pointer-events-auto rounded-xl bg-[#111827]/95 border border-white/10 shadow-panel-lg p-4 max-w-md backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a5b4fc] mb-1">
                Your route to the match
              </p>
              <p className="text-sm font-semibold text-white">{matchTransit.summary}</p>
              <p className="text-xs text-white/50 mt-1">
                Leave by <strong className="text-[#F5C518]">{matchTransit.leaveBy}</strong> · ~
                {matchTransit.durationMin} min
              </p>
              <ol className="mt-2 space-y-1">
                {matchTransit.steps.map((step, i) => (
                  <li key={i} className="text-[11px] text-white/60 flex gap-2">
                    <span className="text-[#6366f1] font-bold shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              {matchTransit.warning && (
                <p className="mt-2 text-[11px] text-[#F5C518]/90 bg-[#F5C518]/10 rounded-lg px-2 py-1.5 border border-[#F5C518]/20">
                  {matchTransit.warning}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <LiveWire feed={live?.feed ?? []} updatedAt={live?.updatedAt} />
    </div>
  );
}
