"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchGatherings } from "@/lib/api";
import {
  DEFAULT_PREFS,
  type ChatMessage,
  type UserPreferences,
} from "@/lib/chat-engine";
import type { GatheringPlace, Match, VibeIntent } from "@/lib/types";
import { planTransitToMatch } from "@/lib/match-route";
import ActiveFanGuide from "@/components/ActiveFanGuide";
import MapPanel from "@/components/MapPanel";
import MatchScoreboard from "@/components/MatchScoreboard";
import LiveBadge from "@/components/LiveBadge";

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
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#6366f1] flex items-center justify-center shadow-glow shrink-0 border border-white/15">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
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

  useEffect(() => {
    loadMap();
  }, [loadMap]);

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
    <div className="min-h-screen flex flex-col bg-miro-bg">
      <header className="shrink-0 border-b border-white/[0.06] bg-[#0a0c14]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MatchDayLogo />
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">Match Day</h1>
              <p className="text-[10px] text-white/35">France vs Senegal · NYC</p>
            </div>
          </div>
          <LiveBadge updatedAt={updatedAt} />
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-5 sm:px-8 py-5 sm:py-6 space-y-5">
        <MatchScoreboard />

        <section className="min-h-[min(68vh,640px)]">
          <MapPanel
            places={places}
            match={match}
            selectedId={selectedId}
            onSelect={setSelectedId}
            center={mapCenter}
            teamCode={prefs.team}
            routeMode={routeMode}
            matchTransit={matchTransit}
            onRouteToMatch={() => setRouteMode(true)}
          />
        </section>

        <ActiveFanGuide
          prefs={prefs}
          onPrefsChange={setPrefs}
          messages={messages}
          loading={chatLoading}
          onSend={handleSend}
          onSelectPlace={setSelectedId}
          onAskRoute={() => {
            setRouteMode(true);
            handleSend("How do I get to the match from Chelsea?");
          }}
        />
      </main>

      <footer className="shrink-0 border-t border-white/[0.05] py-3 text-center text-[10px] text-white/25">
        Match Day · World Cup 2026 NYC
      </footer>
    </div>
  );
}
