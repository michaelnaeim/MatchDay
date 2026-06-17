"use client";

import { useEffect, useState } from "react";
import { formatUpdatedAt } from "@/lib/labels";

interface LiveBadgeProps {
  updatedAt: string;
}

function freshnessTone(iso: string): "fresh" | "warm" | "stale" {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 5) return "fresh";
  if (mins < 30) return "warm";
  return "stale";
}

const TONE_STYLES = {
  fresh: {
    shell: "bg-premium-live/12 border-premium-live/30",
    dot: "bg-premium-live",
    ping: "bg-premium-live",
    label: "text-[#FF8A80]",
    meta: "text-white/55",
  },
  warm: {
    shell: "bg-premium-gold/10 border-premium-gold/25",
    dot: "bg-premium-gold",
    ping: "bg-premium-gold",
    label: "text-premium-gold",
    meta: "text-white/50",
  },
  stale: {
    shell: "bg-white/[0.04] border-white/10",
    dot: "bg-white/40",
    ping: "bg-white/30",
    label: "text-white/45",
    meta: "text-white/35",
  },
} as const;

export default function LiveBadge({ updatedAt }: LiveBadgeProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const tone = freshnessTone(updatedAt);
  const styles = TONE_STYLES[tone];
  const relative = formatUpdatedAt(updatedAt);
  const full = new Date(updatedAt).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-full border text-xs backdrop-blur-sm shrink-0 ${styles.shell}`}
      title={`Map data last updated ${full}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {tone === "fresh" && (
          <span
            className={`animate-ping absolute h-full w-full rounded-full ${styles.ping} opacity-60`}
          />
        )}
        <span className={`relative rounded-full h-2 w-2 ${styles.dot}`} />
      </span>
      <span className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${styles.label}`}>
          Updated
        </span>
        <span className={`text-[10px] sm:text-[11px] font-medium tabular-nums ${styles.meta}`}>
          · {relative}
        </span>
      </span>
    </div>
  );
}
