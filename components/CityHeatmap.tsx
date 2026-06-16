"use client";

import { useCallback, useEffect, useState } from "react";
import type { HeatCell, HeatFeedItem, HeatmapResponse, HeatSource } from "@/lib/heatmap";
import { formatUpdatedAt } from "@/lib/labels";
import { Radio } from "lucide-react";

const SOURCE_LABELS: Record<HeatSource, string> = {
  eventbrite: "Eventbrite",
  luma: "Luma",
  reddit: "Reddit",
  ics: "Calendar",
  curated: "Curated",
};

const SOURCE_COLORS: Record<HeatSource, string> = {
  eventbrite: "#F05537",
  luma: "#ff6b6b",
  reddit: "#FF4500",
  ics: "#6366f1",
  curated: "#8b8b9a",
};

interface CityHeatmapProps {
  teamCode?: string;
  onZoneSelect?: (venueId: string) => void;
  onZoneClick?: (cellId: string) => void;
}

export default function CityHeatmap({
  teamCode = "FRA",
  onZoneSelect,
  onZoneClick,
}: CityHeatmapProps) {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/heatmap?team=${teamCode}`);
      if (!res.ok) throw new Error("heatmap failed");
      const json: HeatmapResponse = await res.json();
      setData(json);
    } catch {
      /* keep last good data */
    }
  }, [teamCode]);

  useEffect(() => {
    setMounted(true);
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const handleCell = (cell: HeatCell) => {
    setSelected(cell.id);
    onZoneClick?.(cell.id);
    if (cell.venueId && onZoneSelect) onZoneSelect(cell.venueId);
  };

  if (!mounted || !data) {
    return (
      <div className="h-72 rounded-2xl bg-[#0a0c14] border border-white/[0.06] animate-pulse" />
    );
  }

  const maxCol = Math.max(...data.cells.map((c) => c.gridCol)) + 1;
  const maxRow = Math.max(...data.cells.map((c) => c.gridRow)) + 1;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0c14] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#F5C518] animate-pulse" />
          <div>
            <h3 className="text-sm font-semibold text-white">Live city heatmap</h3>
            <p className="text-[10px] text-white/40">
              Updated {formatUpdatedAt(data.updatedAt)} · polls every 15s
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(data.sources) as [HeatSource, number][]).map(
            ([src, n]) =>
              n > 0 && (
                <span
                  key={src}
                  className="text-[10px] px-2 py-1 rounded-md border border-white/[0.08] bg-white/[0.03]"
                  style={{ borderColor: `${SOURCE_COLORS[src]}33` }}
                >
                  <span style={{ color: SOURCE_COLORS[src] }} className="font-semibold">
                    {SOURCE_LABELS[src]}
                  </span>
                  <span className="text-white/40 ml-1">{n}</span>
                </span>
              )
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
        {/* Heatmap grid */}
        <div className="p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">
            NYC & NJ fan intensity · France vs Senegal
          </p>
          <div
            className="relative rounded-xl bg-[#060810] border border-white/[0.05] p-4"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${maxRow}, minmax(72px, 1fr))`,
              gap: "8px",
              minHeight: "280px",
            }}
          >
            {/* faint borough guide */}
            <div className="absolute inset-4 rounded-lg border border-dashed border-white/[0.04] pointer-events-none" />
            <span className="absolute bottom-6 left-6 text-[9px] text-white/20 uppercase tracking-widest">
              Manhattan
            </span>
            <span className="absolute bottom-6 right-8 text-[9px] text-white/20 uppercase tracking-widest">
              NJ →
            </span>

            {data.cells.map((cell) => (
              <HeatCellButton
                key={cell.id}
                cell={cell}
                selected={selected === cell.id}
                onClick={() => handleCell(cell)}
                style={{
                  gridColumn: cell.gridCol + 1,
                  gridRow: cell.gridRow + 1,
                }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-white/40">
            <LegendDot color="#2563eb" label="France fans" />
            <LegendDot color="#16a34a" label="Senegal fans" />
            <LegendDot color="#F5C518" label="Mixed / transit" />
            <span className="text-white/25">· brighter = hotter</span>
          </div>
        </div>

        {/* Live feed from APIs */}
        <div className="flex flex-col max-h-[360px] lg:max-h-none">
          <div className="px-4 py-3 border-b border-white/[0.05] shrink-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              Live source feed
            </p>
          </div>
          <div className="flex-1 overflow-y-auto sidebar-scroll p-3 space-y-2">
            {data.feed.map((item) => (
              <FeedRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function heatColor(cell: HeatCell): string {
  const t = cell.heat / 100;
  if (cell.dominantTeam === "FRA") {
    return `rgba(37, 99, 235, ${0.15 + t * 0.75})`;
  }
  if (cell.dominantTeam === "SEN") {
    return `rgba(22, 163, 74, ${0.15 + t * 0.75})`;
  }
  return `rgba(245, 197, 24, ${0.1 + t * 0.55})`;
}

function heatBorder(cell: HeatCell): string {
  if (cell.heat > 85) return "rgba(255, 107, 107, 0.5)";
  if (cell.dominantTeam === "FRA") return "rgba(96, 165, 250, 0.35)";
  if (cell.dominantTeam === "SEN") return "rgba(74, 222, 128, 0.35)";
  return "rgba(255,255,255,0.08)";
}

function HeatCellButton({
  cell,
  selected,
  onClick,
  style,
}: {
  cell: HeatCell;
  selected: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...style,
        backgroundColor: heatColor(cell),
        borderColor: selected ? "#F5C518" : heatBorder(cell),
        boxShadow: cell.heat > 88 ? `0 0 24px ${heatColor(cell)}` : undefined,
      }}
      className={`relative rounded-xl border text-left p-2.5 transition-all duration-500 hover:scale-[1.03] ${
        selected ? "ring-1 ring-[#F5C518]/50 scale-[1.03]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-lg leading-none">{cell.emoji}</span>
        {cell.delta !== 0 && (
          <span
            className={`text-[9px] font-bold tabular-nums ${
              cell.delta > 0 ? "text-[#4ade80]" : "text-white/40"
            }`}
          >
            {cell.delta > 0 ? "+" : ""}
            {cell.delta}
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium text-white/90 mt-1.5 leading-tight line-clamp-2">
        {cell.name}
      </p>
      <p className="text-[11px] font-bold text-white/70 tabular-nums mt-1">
        {cell.heat}%
      </p>
      {cell.trend === "surge" && (
        <span className="absolute top-1.5 right-1.5 text-[8px] font-bold text-[#FF6B6B] uppercase">
          surge
        </span>
      )}
    </button>
  );
}

function FeedRow({ item }: { item: HeatFeedItem }) {
  const color = SOURCE_COLORS[item.source];
  return (
    <div className="flex gap-2.5 p-2.5 rounded-xl bg-[#111827]/60 border border-white/[0.04] chat-fade-in">
      <span
        className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded h-fit mt-0.5"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {SOURCE_LABELS[item.source]}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-white/35">{item.zone}</p>
        <p className="text-xs text-white/75 leading-snug mt-0.5">{item.text}</p>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
