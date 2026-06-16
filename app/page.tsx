"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchGatherings } from "@/lib/api";
import {
  DEFAULT_PREFS,
  type ChatMessage,
  type UserPreferences,
} from "@/lib/chat-engine";
import type { GatheringPlace, Match, VibeIntent } from "@/lib/types";
import type { LiveMapResponse } from "@/lib/live-map";
import { planTransitToMatch } from "@/lib/match-route";
import ActiveFanGuide from "@/components/ActiveFanGuide";
import MapPanel from "@/components/MapPanel";
import MatchStrip from "@/components/MatchStrip";
import LiveWire from "@/components/LiveWire";
import LiveBadge from "@/components/LiveBadge";
import PreferenceSliders from "@/components/PreferenceSliders";

const NYC_CENTER: [number, number] = [40.758, -73.985];

function crowdToIntent(crowd: number): VibeIntent {
  if (crowd < 30) return "quiet";
  if (crowd < 65) return "authentic";
  if (crowd < 85) return "all";
  return "party";
}

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function MatchDayLogo() {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#6366f1] flex items-center justify-center shadow-glow shrink-0 border border-white/15">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" fill="white" />
        <path
          d="M12 5c-3.5 0-6.5 2.2-7.7 5.3 1 .8 2.2 1.2 3.5 1.2 1.8 0 3.5-.8 4.7-2 .8 1.5 2 2.8 3.5 3.5C14.2 15.8 13.2 17 12 17c-1.2 0-2.2-1.2-3.5-3 1.4-.7 2.6-2 3.5-3.5 1.2 1.2 2.9 2 4.7 2 1.3 0 2.5-.4 3.5-1.2C18.5 7.2 15.5 5 12 5z"
          fill="#050508"
        />
      </svg>
    </div>
  );
}

export default function HomePage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [places, setPlaces] = useState<GatheringPlace[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [updatedAt, setUpdatedAt] = useState("2026-06-28T20:00:00.000Z");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeMode, setRouteMode] = useState(false);
  const [live, setLive] = useState<LiveMapResponse | null>(null);
  const [mapMounted, setMapMounted] = useState(false);

  const matchTransit = useMemo(
    () => (match ? planTransitToMatch(match) : null),
    [match]
  );

  const loadMap = useCallback(async () => {
    const data = await fetchGatherings({
      team: prefs.team,
      intent: crowdToIntent(prefs.crowd),
      lat: NYC_CENTER[0],
      lng: NYC_CENTER[1],
    });
    setPlaces(data.places);
    setMatch(data.match);
    setUpdatedAt(data.updatedAt);
    if (data.places?.length) setSelectedId((id) => id ?? data.places[0].id);
  }, [prefs.team, prefs.crowd]);

  const loadLive = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-map?team=${prefs.team}`);
      if (!res.ok) return;
      setLive(await res.json());
    } catch {
      /* keep */
    }
  }, [prefs.team]);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  useEffect(() => {
    setMapMounted(true);
    loadLive();
    const t = setInterval(loadLive, 8000);
    return () => clearInterval(t);
  }, [loadLive]);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
      setMessages((m) => [...m, userMsg]);
      setChatLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, prefs }),
        });
        const data = await res.json();
        if (data.message) {
          setMessages((m) => [...m, data.message]);
          if (data.message.showRouteToMatch) setRouteMode(true);
        }
        if (data.places?.length) {
          setPlaces(data.places);
          setSelectedId(data.places[0].id);
        }
        if (data.updatedAt) setUpdatedAt(data.updatedAt);
      } catch {
        setMessages((m) => [
          ...m,
          { id: uid(), role: "assistant", content: "Try again in a moment." },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [prefs]
  );

  const mapCenter: [number, number] = useMemo(() => {
    if (routeMode && match) return [match.lat, match.lng];
    const selected = places.find((p) => p.id === selectedId);
    if (selected) return [selected.lat, selected.lng];
    if (match) return [match.lat, match.lng];
    return NYC_CENTER;
  }, [routeMode, match, places, selectedId]);

  return (
    <div className="h-screen flex flex-col bg-miro-bg overflow-hidden">
      <header className="shrink-0 border-b border-white/[0.06] bg-[#0a0c14]/95 backdrop-blur-xl z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-6">
            <div className="flex items-center gap-2.5 justify-center lg:justify-start">
              <MatchDayLogo />
              <div>
                <h1 className="text-sm font-semibold text-white tracking-tight">Match Day</h1>
                <p className="text-[10px] text-white/35">NYC fan intelligence</p>
              </div>
            </div>

            <div className="w-full min-w-0 px-0 sm:px-4">
              <MatchStrip />
            </div>

            <div className="flex justify-center lg:justify-end">
              <LiveBadge updatedAt={updatedAt} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 w-full mx-auto px-2 sm:px-4 py-2">
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(0,38%)_minmax(0,62%)] gap-2 min-h-0 h-full rounded-2xl overflow-hidden border border-white/[0.06] bg-[#080a12]/50">
          {/* Map — slightly taller on mobile; full height on desktop */}
          <div className="h-[22vh] max-h-[210px] shrink-0 lg:h-full lg:max-h-none lg:min-h-0 flex flex-col p-1.5 sm:p-2">
            <MapPanel
              places={places}
              match={match}
              selectedId={selectedId}
              onSelect={setSelectedId}
              center={mapCenter}
              pulses={live?.pulses}
              liveUpdatedAt={live?.updatedAt}
              routeMode={routeMode}
              matchTransit={matchTransit}
              onRouteToMatch={() => setRouteMode(true)}
              mounted={mapMounted}
            />
          </div>

          {/* Scroll the whole stack on mobile so prefs + guide + live chat are all reachable */}
          <div className="flex-1 min-h-0 flex flex-col gap-2 p-1.5 sm:p-2 border-t lg:border-t-0 lg:border-l border-white/[0.06] overflow-y-auto lg:overflow-hidden sidebar-scroll">
            <div className="shrink-0 rounded-xl border border-[#6366f1]/25 bg-[#0a0c14] shadow-[0_0_24px_rgba(99,102,241,0.1)]">
              <PreferenceSliders prefs={prefs} onChange={setPrefs} collapsed={false} />
            </div>
            <div className="shrink-0 min-h-[320px] lg:flex-1 lg:min-h-0 flex flex-col overflow-hidden">
              <ActiveFanGuide
                messages={messages}
                loading={chatLoading}
                onSend={handleSend}
                onSelectPlace={setSelectedId}
                onAskRoute={() => {
                  setRouteMode(true);
                  handleSend("How do I get to the match from Chelsea?");
                }}
              />
            </div>
            <div className="shrink-0">
              <LiveWire feed={live?.feed ?? []} teamCode={prefs.team} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
