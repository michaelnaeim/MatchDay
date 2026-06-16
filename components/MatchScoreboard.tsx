"use client";

import { useEffect, useState } from "react";
import { FEATURED_MATCH } from "@/lib/live-simulation";

export default function MatchScoreboard() {
  const match = FEATURED_MATCH;
  const [minute, setMinute] = useState(match.minute);
  const [mounted, setMounted] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => {
      setMinute((m) => (m < 90 ? m + 1 : m));
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
    }, 15000);
    return () => clearInterval(t);
  }, [mounted]);

  if (!mounted) {
    return <div className="h-44 rounded-2xl bg-premium-card animate-pulse shadow-score" />;
  }

  const progress = Math.min(100, (minute / 90) * 100);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-score">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d1f4d] via-[#0a0e1a] to-[#0a2e1a]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute top-0 left-0 w-2/5 h-full bg-gradient-to-r from-[#2563eb]/20 to-transparent" />
      <div className="absolute top-0 right-0 w-2/5 h-full bg-gradient-to-l from-[#16a34a]/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,197,24,0.06),transparent_70%)]" />

      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#2563eb] via-[#F5C518] to-[#16a34a] transition-all duration-1000 shadow-[0_0_12px_rgba(245,197,24,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative px-5 sm:px-10 py-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#F5C518]">
              FIFA World Cup 2026
            </span>
            <span className="text-white/15">|</span>
            <span className="text-[10px] uppercase tracking-wider text-white/45">
              {match.stage}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF3B30]/20 border border-[#FF3B30]/45 shadow-[0_0_24px_rgba(255,59,48,0.3)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-[#FF3B30] opacity-75" />
              <span className="relative rounded-full h-2.5 w-2.5 bg-[#FF3B30]" />
            </span>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#FF8A80]">
              Live {minute}&apos;
            </span>
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-12 max-w-3xl mx-auto">
          <TeamSide
            flag={match.homeFlag}
            name={match.homeName}
            sub="Les Bleus"
            align="right"
            accent="from-[#2563eb] to-[#60a5fa]"
          />
          <div className={`text-center ${flash ? "animate-score-flash" : ""}`}>
            <div className="flex items-center justify-center gap-5 sm:gap-8">
              <span className="text-5xl sm:text-8xl font-bold text-white tabular-nums tracking-tight drop-shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                {match.homeScore}
              </span>
              <span className="text-3xl text-white/20 font-extralight">:</span>
              <span className="text-5xl sm:text-8xl font-bold text-white tabular-nums tracking-tight drop-shadow-[0_0_30px_rgba(22,163,74,0.4)]">
                {match.awayScore}
              </span>
            </div>
          </div>
          <TeamSide
            flag={match.awayFlag}
            name={match.awayName}
            sub="Lions of Teranga"
            align="left"
            accent="from-[#16a34a] to-[#4ade80]"
          />
        </div>

        <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          <StatPill label="Possession" value={`${match.possession[0]}–${match.possession[1]}%`} />
          <StatPill label="Shots" value={`${match.shots[0]}–${match.shots[1]}`} />
          <StatPill label="Venue" value={match.venueName} wide />
          <StatPill label="Half" value="2nd half" />
        </div>
      </div>
    </div>
  );
}

function TeamSide({
  flag,
  name,
  sub,
  align,
  accent,
}: {
  flag: string;
  name: string;
  sub: string;
  align: "left" | "right";
  accent: string;
}) {
  return (
    <div
      className={`flex flex-col ${align === "right" ? "items-end text-right" : "items-start text-left"}`}
    >
      <span className="text-4xl sm:text-5xl mb-2 drop-shadow-lg">{flag}</span>
      <span className="text-base sm:text-lg font-semibold text-white">{name}</span>
      <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{sub}</span>
      <div className={`h-1 w-16 mt-2.5 rounded-full bg-gradient-to-r ${accent}`} />
    </div>
  );
}

function StatPill({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-center backdrop-blur-sm ${wide ? "sm:col-span-2" : ""}`}
    >
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/35 font-semibold">{label}</p>
      <p className="text-[12px] sm:text-sm font-semibold text-white/90 mt-1 truncate">{value}</p>
    </div>
  );
}
