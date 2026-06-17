"use client";

import type { UserPreferences } from "@/lib/chat-engine";
import { TEAMS } from "@/lib/mock-data";
import { Sliders } from "lucide-react";

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

  const crowdLabel =
    prefs.crowd < 30 ? "Quiet" : prefs.crowd < 65 ? "Authentic" : prefs.crowd < 85 ? "Mixed" : "Party";

  return (
    <div className="border-b border-white/[0.06] bg-[#0a0c14]/90 shrink-0">
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-white/50 hover:text-white/80"
        >
          <span className="inline-flex items-center gap-2 uppercase tracking-wider font-medium">
            <Sliders className="w-3.5 h-3.5" />
            Trip preferences
          </span>
          <span>{collapsed ? "Show" : "Hide"}</span>
        </button>
      )}

      {!collapsed && (
        <div className="px-4 pb-3 pt-1 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-3.5 h-3.5 text-[#a5b4fc]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Trip preferences
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wide font-medium">
                Team
              </label>
              <select
                value={prefs.team}
                onChange={(e) => set("team", e.target.value)}
                className="mt-1 w-full rounded-lg bg-[#111827] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]/50"
              >
                {TEAMS.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.flag} {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-white/40 uppercase tracking-wide font-medium">
                  Max travel
                </span>
                <span className="text-white/80 font-medium">{prefs.maxTravelMin} min</span>
              </div>
              <input
                type="range"
                min={15}
                max={90}
                step={5}
                value={prefs.maxTravelMin}
                onChange={(e) => set("maxTravelMin", Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/40 uppercase tracking-wide font-medium">
                Crowd vibe
              </span>
              <span className="text-[#a5b4fc] font-semibold">{crowdLabel}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={prefs.crowd}
              onChange={(e) => set("crowd", Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/30 mt-0.5">
              <span>Quiet</span>
              <span>Party</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Toggle
              on={prefs.accessibleOnly}
              onClick={() => set("accessibleOnly", !prefs.accessibleOnly)}
              label="Accessible only"
            />
            <Toggle
              on={prefs.nativeLanguage}
              onClick={() => set("nativeLanguage", !prefs.nativeLanguage)}
              label="Native language"
            />
          </div>

          <p className="text-[10px] text-white/30">
            Starting from {prefs.originLabel}
          </p>
        </div>
      )}
    </div>
  );
}

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        on
          ? "bg-[#6366f1]/20 border-[#6366f1]/40 text-[#a5b4fc]"
          : "bg-white/[0.04] border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
      }`}
    >
      {label}
    </button>
  );
}
