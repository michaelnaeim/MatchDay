"use client";

import { useEffect, useRef } from "react";
import type { MapLivePing } from "@/lib/live-map";
import { SOURCE_COLORS, SOURCE_LABELS } from "@/lib/map-styles";
import type { HeatSource } from "@/lib/heatmap";
import { Radio } from "lucide-react";

interface LiveWireProps {
  feed: MapLivePing[];
  updatedAt?: string;
}

export default function LiveWire({ feed, updatedAt }: LiveWireProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollLeft = 0;
  }, [feed[0]?.id]);

  const items = feed.length > 0 ? feed : [];

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[#060810] text-white">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
        <Radio className="w-3.5 h-3.5 text-[#F5C518] animate-pulse shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5C518]">
          Live wire
        </span>
        {updatedAt && (
          <span className="text-[10px] text-white/40 ml-auto tabular-nums">
            updating live
          </span>
        )}
      </div>
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto sidebar-scroll px-3 py-2.5 live-wire-track"
      >
        {items.length === 0 ? (
          <span className="text-xs text-white/50 whitespace-nowrap">
            Scanning city activity…
          </span>
        ) : (
          items.map((item) => (
            <WireCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

function WireCard({ item }: { item: MapLivePing }) {
  const color = SOURCE_COLORS[item.source as HeatSource];
  return (
    <div className="live-wire-card shrink-0 flex items-start gap-2.5 min-w-[220px] max-w-[280px] px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10">
      <span
        className="shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md mt-0.5"
        style={{ backgroundColor: `${color}33`, color }}
      >
        {SOURCE_LABELS[item.source as HeatSource]}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-white/45 font-medium">{item.zone}</p>
        <p className="text-[12px] text-white/90 leading-snug line-clamp-2 mt-0.5">
          {item.title}
        </p>
      </div>
    </div>
  );
}
