"use client";

import { useEffect, useState } from "react";
import { FEATURED_MATCH } from "@/lib/live-simulation";

/** Match bar — header top-right, broadcast-style but compact */
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
    return <div className="h-14 sm:h-16 min-w-[280px] sm:min-w-[420px] rounded-xl bg-white/[0.04] animate-pulse" />;
  }

  const progress = Math.min(100, (minute / 90) * 100);

  return (
    <div className="relative min-w-[280px] sm:min-w-[420px] max-w-xl rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.1] backdrop-blur-sm shrink-0">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#2563eb] via-[#F5C518] to-[#16a34a] transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 sm:gap-5 px-4 sm:px-5 py-3 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xl sm:text-2xl shrink-0">{match.homeFlag}</span>
          <div className="hidden sm:block min-w-0">
            <p className="text-xs font-semibold text-white/90 truncate">{match.homeName}</p>
            <p className="text-[9px] text-white/35 uppercase tracking-wider">Les Bleus</p>
          </div>
        </div>

        <div className="flex flex-col items-center shrink-0 px-1">
          <span className="text-[9px] sm:text-[10px] text-white/35 uppercase tracking-wider mb-0.5 hidden sm:block">
            {match.stage}
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">
            {match.homeScore}
            <span className="text-white/25 mx-1 sm:mx-1.5 font-light text-xl sm:text-2xl">:</span>
            {match.awayScore}
          </span>
          <span className="text-[9px] text-white/40 mt-1 hidden md:inline truncate max-w-[140px]">
            {match.venueName}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0 justify-end">
          <div className="hidden sm:block min-w-0 text-right">
            <p className="text-xs font-semibold text-white/90 truncate">{match.awayName}</p>
            <p className="text-[9px] text-white/35 uppercase tracking-wider">Lions</p>
          </div>
          <span className="text-xl sm:text-2xl shrink-0">{match.awayFlag}</span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#FF3B30]/15 border border-[#FF3B30]/35 shrink-0 ml-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute h-full w-full rounded-full bg-[#FF3B30] opacity-70" />
            <span className="relative rounded-full h-2 w-2 bg-[#FF3B30]" />
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#FF8A80] uppercase tracking-wide">
            Live {minute}&apos;
          </span>
        </span>
      </div>
    </div>
  );
}
