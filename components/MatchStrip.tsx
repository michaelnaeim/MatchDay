"use client";

import { useEffect, useState } from "react";
import { FEATURED_MATCH } from "@/lib/live-simulation";

/** Compact match bar — lives in header area, not a hero block */
export default function MatchStrip() {
  const match = FEATURED_MATCH;
  const [minute, setMinute] = useState(match.minute);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => setMinute((m) => (m < 90 ? m + 1 : m)), 15000);
    return () => clearInterval(t);
  }, [mounted]);

  if (!mounted) {
    return <div className="h-11 rounded-xl bg-white/[0.04] animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <span className="text-base sm:text-lg">{match.homeFlag}</span>
        <span className="text-sm sm:text-base font-bold text-white tabular-nums">
          {match.homeScore}
          <span className="text-white/30 mx-0.5 font-light">:</span>
          {match.awayScore}
        </span>
        <span className="text-base sm:text-lg">{match.awayFlag}</span>
      </div>

      <span className="hidden sm:inline text-[10px] text-white/35 uppercase tracking-wider truncate max-w-[100px]">
        {match.venueName}
      </span>

      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FF3B30]/15 border border-[#FF3B30]/35 shrink-0">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute h-full w-full rounded-full bg-[#FF3B30] opacity-70" />
          <span className="relative rounded-full h-1.5 w-1.5 bg-[#FF3B30]" />
        </span>
        <span className="text-[10px] font-bold text-[#FF8A80] uppercase tracking-wide">
          {minute}&apos;
        </span>
      </span>
    </div>
  );
}
