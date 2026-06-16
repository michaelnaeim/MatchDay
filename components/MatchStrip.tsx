"use client";

import { useEffect, useState } from "react";
import { FEATURED_MATCH } from "@/lib/live-simulation";

/** Centered broadcast match bar for header */
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
    return (
      <div className="h-16 w-full max-w-2xl mx-auto rounded-xl bg-white/[0.04] animate-pulse" />
    );
  }

  const progress = Math.min(100, (minute / 90) * 100);

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-white/[0.05] border border-white/[0.12] backdrop-blur-sm shadow-[0_0_30px_rgba(37,99,235,0.08)]">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#2563eb] via-[#F5C518] to-[#16a34a] transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="px-4 sm:px-6 py-3 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5C518]">
            FIFA World Cup 2026
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[10px] uppercase tracking-wider text-white/45">{match.stage}</span>
          <span className="text-white/20 hidden sm:inline">·</span>
          <span className="text-[10px] text-white/40 hidden sm:inline">{match.venueName}</span>
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <TeamBlock flag={match.homeFlag} name={match.homeName} sub="Les Bleus" />
          <div className="flex flex-col items-center shrink-0">
            <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums leading-none">
              {match.homeScore}
              <span className="text-white/25 mx-1.5 font-light text-2xl sm:text-3xl">:</span>
              {match.awayScore}
            </span>
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-[#FF3B30]/15 border border-[#FF3B30]/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-[#FF3B30] opacity-70" />
                <span className="relative rounded-full h-2 w-2 bg-[#FF3B30]" />
              </span>
              <span className="text-[11px] font-bold text-[#FF8A80] uppercase tracking-wide">
                Live {minute}&apos;
              </span>
            </span>
          </div>
          <TeamBlock flag={match.awayFlag} name={match.awayName} sub="Lions" align="left" />
        </div>
      </div>
    </div>
  );
}

function TeamBlock({
  flag,
  name,
  sub,
  align = "right",
}: {
  flag: string;
  name: string;
  sub: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 min-w-[88px] sm:min-w-[120px] ${
        align === "right" ? "flex-row-reverse text-right" : "text-left"
      }`}
    >
      <span className="text-2xl sm:text-3xl shrink-0">{flag}</span>
      <div className="min-w-0 hidden sm:block">
        <p className="text-sm font-semibold text-white truncate">{name}</p>
        <p className="text-[9px] text-white/35 uppercase tracking-wider">{sub}</p>
      </div>
    </div>
  );
}
