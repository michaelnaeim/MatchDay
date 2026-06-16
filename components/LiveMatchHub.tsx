"use client";

import { useEffect, useState } from "react";
import {
  FEATURED_MATCH,
  getPulseZones,
  jitterPulse,
  type LivePulseZone,
} from "@/lib/live-simulation";
import LiveChatTicker from "./LiveChatTicker";

interface LiveMatchHubProps {
  teamCode?: string;
  onZoneSelect?: (venueId: string) => void;
}

export default function LiveMatchHub({
  teamCode = "FRA",
  onZoneSelect,
}: LiveMatchHubProps) {
  const match = FEATURED_MATCH;
  const [pulse, setPulse] = useState<LivePulseZone[]>(() =>
    getPulseZones(teamCode)
  );
  const [minute, setMinute] = useState(match.minute);
  const [watching, setWatching] = useState(match.metroWatching);
  const [highlightZone, setHighlightZone] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    setPulse(getPulseZones(teamCode));
  }, [teamCode, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const pulseTimer = setInterval(() => {
      setPulse((p) => jitterPulse(p));
      setWatching((w) => w + Math.floor(Math.random() * 55) + 12);
    }, 3500);

    const matchTimer = setInterval(() => {
      setMinute((m) => {
        if (m >= 90) return m;
        return m + 1;
      });
    }, 12000);

    return () => {
      clearInterval(pulseTimer);
      clearInterval(matchTimer);
    };
  }, [mounted]);

  const handleZoneClick = (zone: LivePulseZone) => {
    setHighlightZone(zone.id);
    if (zone.venueId && onZoneSelect) onZoneSelect(zone.venueId);
    setTimeout(() => setHighlightZone(null), 1800);
  };

  if (!mounted) {
    return <div className="h-64 rounded-2xl bg-premium-card animate-pulse" />;
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-score border border-white/[0.08] bg-premium-surface">
      {/* Broadcast scoreboard */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-premium-france/25 via-premium-card to-premium-senegal/25" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDQwaDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />

        <div className="relative px-4 sm:px-8 py-5 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-premium-gold">
                FIFA World Cup 2026
              </span>
              <span className="text-white/20">|</span>
              <span className="text-[10px] uppercase tracking-wider text-premium-muted">
                {match.stage}
              </span>
            </div>
            <LiveBroadcastPill minute={minute} />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8 max-w-3xl mx-auto">
            <TeamBlock
              flag={match.homeFlag}
              name={match.homeName}
              sub="Les Bleus"
              align="right"
              color="france"
            />
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-3 sm:gap-5 tabular-nums">
                <span className="text-4xl sm:text-6xl font-display font-bold text-white tracking-tight">
                  {match.homeScore}
                </span>
                <span className="text-xl sm:text-2xl text-white/25 font-light">
                  —
                </span>
                <span className="text-4xl sm:text-6xl font-display font-bold text-white tracking-tight">
                  {match.awayScore}
                </span>
              </div>
              <p className="text-[11px] text-premium-muted mt-2 uppercase tracking-widest">
                {minute}&apos; · 2nd half
              </p>
            </div>
            <TeamBlock
              flag={match.awayFlag}
              name={match.awayName}
              sub="Lions of Teranga"
              align="left"
              color="senegal"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-premium-muted">
            <span>{match.venueName} · East Rutherford, NJ</span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span>
              Possession {match.possession[0]}% – {match.possession[1]}%
            </span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span>
              Shots {match.shots[0]} – {match.shots[1]}
            </span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span className="text-premium-cream/80 tabular-nums">
              {watching.toLocaleString()} watching in NYC metro
            </span>
          </div>
        </div>
      </div>

      {/* Fast live chat ticker */}
      <div className="px-4 sm:px-6 py-4 border-t border-white/[0.06] bg-black/20">
        <LiveChatTicker teamCode={teamCode} />
      </div>

      {/* City pulse */}
      <div className="px-4 sm:px-6 py-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-muted">
            City pulse · France vs Senegal
          </h3>
          <span className="text-[10px] text-white/30">Tap zone → map</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {pulse.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => handleZoneClick(zone)}
              className={`text-left rounded-xl border px-3 py-3 transition-all duration-300 ${
                highlightZone === zone.id
                  ? "border-premium-gold/50 bg-premium-gold/10 scale-[1.02] shadow-glow"
                  : "border-white/[0.06] bg-premium-elevated/60 hover:border-white/12 hover:bg-premium-elevated"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-premium-cream flex items-center gap-2">
                  <span>{zone.emoji}</span>
                  <span className="truncate">{zone.name}</span>
                </span>
                <span className="text-xs font-bold tabular-nums text-white/60 shrink-0">
                  {zone.intensity}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${zone.intensity}%`,
                    background:
                      zone.team === "SEN"
                        ? "linear-gradient(90deg, #1a6b3c, #3cb371)"
                        : zone.team === "FRA"
                          ? "linear-gradient(90deg, #1e3a6e, #4a7fd4)"
                          : "linear-gradient(90deg, #c9a84c, #e8c547)",
                  }}
                />
              </div>
              <p className="text-[10px] text-premium-muted mt-2 line-clamp-1">
                {zone.label}
                {zone.trend === "surge" && (
                  <span className="ml-1.5 text-premium-live font-semibold">
                    SURGE
                  </span>
                )}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveBroadcastPill({ minute }: { minute: number }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-premium-live/15 border border-premium-live/30">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-premium-live opacity-60" />
        <span className="relative rounded-full h-2 w-2 bg-premium-live" />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-premium-live">
        Live
      </span>
      <span className="text-[11px] font-bold tabular-nums text-white/80">
        {minute}&apos;
      </span>
    </span>
  );
}

function TeamBlock({
  flag,
  name,
  sub,
  align,
  color,
}: {
  flag: string;
  name: string;
  sub: string;
  align: "left" | "right";
  color: "france" | "senegal";
}) {
  const bar =
    color === "france" ? "bg-premium-france-light" : "bg-premium-senegal-light";
  return (
    <div
      className={`flex flex-col ${align === "right" ? "items-end text-right" : "items-start text-left"}`}
    >
      <span className="text-3xl sm:text-4xl mb-1">{flag}</span>
      <span className="text-sm sm:text-base font-semibold text-white tracking-tight">
        {name}
      </span>
      <span className="text-[10px] text-premium-muted uppercase tracking-wider mt-0.5">
        {sub}
      </span>
      <div className={`h-0.5 w-12 mt-2 rounded-full ${bar} opacity-60`} />
    </div>
  );
}
