"use client";

import { useEffect, useMemo, useState } from "react";
import type { MapLivePing } from "@/lib/live-map";
import {
  buildTickerMessages,
  nextLiveMessage,
  type LiveFanMessage,
} from "@/lib/live-simulation";
import { SOURCE_COLORS, SOURCE_LABELS } from "@/lib/map-styles";
import type { HeatSource } from "@/lib/heatmap";
import { Radio } from "lucide-react";

interface LiveWireProps {
  feed: MapLivePing[];
  teamCode?: string;
}

interface WireItem {
  id: string;
  kind: "api" | "fan";
  source: HeatSource | "fan";
  zone: string;
  text: string;
  avatar?: string;
}

export default function LiveWire({ feed, teamCode }: LiveWireProps) {
  const [mounted, setMounted] = useState(false);
  const [fanStream, setFanStream] = useState<LiveFanMessage[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    setFanStream(buildTickerMessages(24));
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => {
      setFanStream((prev) => [...prev.slice(-40), nextLiveMessage(teamCode)]);
    }, 320);
    return () => clearInterval(t);
  }, [mounted, teamCode]);

  const items = useMemo(() => {
    const apiItems: WireItem[] = feed.map((f) => ({
      id: f.id,
      kind: "api" as const,
      source: f.source,
      zone: f.zone,
      text: f.title,
    }));
    const fanItems: WireItem[] = fanStream.map((m) => ({
      id: m.id,
      kind: "fan" as const,
      source: "fan" as const,
      zone: m.zone,
      text: m.text,
      avatar: m.avatar,
    }));
    const merged = [...apiItems, ...fanItems];
    return merged.length
      ? merged
      : [
          {
            id: "empty",
            kind: "fan" as const,
            source: "fan" as const,
            zone: "NYC",
            text: "Fan activity heating up across the city…",
          },
        ];
  }, [feed, fanStream]);

  const doubled = useMemo(() => [...items, ...items], [items]);

  if (!mounted) {
    return <div className="h-[148px] shrink-0 rounded-2xl bg-white/[0.03] animate-pulse" />;
  }

  return (
    <div className="live-wire-fire shrink-0 rounded-2xl overflow-hidden border border-white/[0.08] shadow-panel">
      <div className="live-wire-fire-bg" />

      <div className="relative flex items-center justify-between gap-3 px-4 py-2 border-b border-white/[0.06] bg-black/30">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute h-full w-full rounded-full bg-[#FF3B30] opacity-75" />
            <span className="relative rounded-full h-2 w-2 bg-[#FF3B30]" />
          </span>
          <Radio className="w-3.5 h-3.5 text-[#F5C518]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#F5C518]">
            Live fan wire
          </span>
          <span className="text-[10px] text-white/35 hidden sm:inline">
            Eventbrite · Reddit · Luma · fan pulse
          </span>
        </div>
        <span className="text-[10px] text-white/40 tabular-nums">
          {items.length}+ live
        </span>
      </div>

      <div className="relative h-[120px] overflow-hidden bg-black/25 live-wire-vmask">
        <div className="live-wire-vscroll px-3 py-2 space-y-2">
          {doubled.map((item, i) => (
            <WireRow key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WireRow({ item }: { item: WireItem }) {
  const isFan = item.kind === "fan";
  const color = isFan ? "#F5C518" : SOURCE_COLORS[item.source as HeatSource];
  const label = isFan ? "Fan" : SOURCE_LABELS[item.source as HeatSource];

  return (
    <div className="live-wire-row flex items-start gap-2.5 px-3 py-2 rounded-xl bg-black/35 border border-white/[0.06] backdrop-blur-sm">
      {item.avatar && <span className="text-sm shrink-0 leading-none mt-0.5">{item.avatar}</span>}
      <span
        className="shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md mt-0.5"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-white/40 font-medium">{item.zone}</p>
        <p className="text-[12px] text-white/95 leading-snug">{item.text}</p>
      </div>
    </div>
  );
}
