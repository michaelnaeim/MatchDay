"use client";

import type { UserPreferences } from "@/lib/chat-engine";
import { TEAMS } from "@/lib/mock-data";
import { crowdLabel, defaultRivalFor } from "@/lib/rival-banter";
import { Flame, MapPin, Shield, Sliders } from "lucide-react";

interface PreferenceSlidersProps {
  prefs: UserPreferences;
  onChange: (prefs: UserPreferences) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function PreferenceSliders({
  prefs,
  onChange,
  collapsed,
  onToggle,
}: PreferenceSlidersProps) {
  const set = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) =>
    onChange({ ...prefs, [key]: value });

  const setTeam = (team: string) => {
    onChange({
      ...prefs,
      team,
      rivalTeam: defaultRivalFor(team),
    });
  };

  const rivals = TEAMS.filter((t) => t.code !== prefs.team);

  return (
    <div className="relative bg-[#0a0c14] shrink-0">
      <div className="absolute inset-0 bg-gradient-to-r from-[#2563eb]/8 via-[#6366f1]/5 to-[#16a34a]/8 pointer-events-none" />

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="relative w-full flex items-center justify-between px-4 py-2.5 text-xs text-white/50 hover:text-white/80"
        >
          <span className="inline-flex items-center gap-2 uppercase tracking-wider font-medium">
            <Sliders className="w-3.5 h-3.5" />
            Trip preferences
          </span>
          <span>{collapsed ? "Show" : "Hide"}</span>
        </button>
      )}

      {!collapsed && (
        <div className="relative px-4 py-3.5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/35 flex items-center justify-center">
                <Sliders className="w-4 h-4 text-[#a5b4fc]" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-white">
                  Trip preferences
                </p>
                <p className="text-[11px] text-white/45">Crowd · rivals · banter</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/40">
              <MapPin className="w-3.5 h-3.5 text-[#F5C518]" />
              <span>{prefs.originLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] text-white/55 uppercase tracking-wide font-bold">
                My team
              </label>
              <select
                value={prefs.team}
                onChange={(e) => setTeam(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-[#111827] border border-white/15 px-3 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-[#6366f1]/60"
              >
                {TEAMS.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.flag} {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] text-white/55 uppercase tracking-wide font-bold">
                Clown on (rival)
              </label>
              <select
                value={prefs.rivalTeam}
                onChange={(e) => set("rivalTeam", e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-[#111827] border border-[#FF6B35]/25 px-3 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-[#FF6B35]/50"
              >
                {rivals.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.flag} {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-[11px] text-white/55 uppercase tracking-wide font-bold">
                  How packed?
                </label>
                <span className="text-sm font-bold text-[#F5C518]">{crowdLabel(prefs.crowd)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={prefs.crowd}
                onChange={(e) => set("crowd", Number(e.target.value))}
                className="w-full h-2.5 rounded-full appearance-none bg-white/15 cursor-pointer accent-[#F5C518]"
              />
              <div className="flex justify-between text-[10px] text-white/35 mt-1 font-medium">
                <span>Empty</span>
                <span>Packed</span>
                <span>Chaos</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-[11px] text-white/55 uppercase tracking-wide font-bold">
                  Max travel
                </label>
                <span className="text-sm font-bold text-white">{prefs.maxTravelMin} min</span>
              </div>
              <input
                type="range"
                min={15}
                max={90}
                step={5}
                value={prefs.maxTravelMin}
                onChange={(e) => set("maxTravelMin", Number(e.target.value))}
                className="w-full h-2.5 rounded-full appearance-none bg-white/15 cursor-pointer accent-[#6366f1]"
              />
            </div>

            <div className="col-span-2 flex flex-wrap items-center gap-2">
              <Toggle
                on={prefs.ownFansOnly}
                onClick={() => set("ownFansOnly", !prefs.ownFansOnly)}
                label="Fans"
                icon={<Shield className="w-3.5 h-3.5" />}
                activeClass="border-[#2563eb]/50 bg-[#2563eb]/20 text-[#93c5fd]"
              />
              <Toggle
                on={prefs.rivalRoast}
                onClick={() => set("rivalRoast", !prefs.rivalRoast)}
                label="Rival roast mode"
                icon={<Flame className="w-3.5 h-3.5" />}
                activeClass="border-[#FF6B35]/50 bg-[#FF6B35]/15 text-[#FF8A65]"
              />
              <Toggle
                on={prefs.accessibleOnly}
                onClick={() => set("accessibleOnly", !prefs.accessibleOnly)}
                label="Accessible"
              />
              <Toggle
                on={prefs.nativeLanguage}
                onClick={() => set("nativeLanguage", !prefs.nativeLanguage)}
                label="Native lang"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  on,
  onClick,
  label,
  icon,
  activeClass,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
        on
          ? activeClass ?? "bg-[#6366f1]/25 border-[#6366f1]/50 text-[#c7d2fe]"
          : "bg-white/[0.06] border-white/15 text-white/60 hover:border-white/30 hover:text-white/90"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
