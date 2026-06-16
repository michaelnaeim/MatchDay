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
    <div className="border-b border-miro-border bg-miro-canvas">
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-miro-ink-muted hover:text-miro-ink"
        >
          <span className="inline-flex items-center gap-2 uppercase tracking-wider font-medium">
            <Sliders className="w-3.5 h-3.5" />
            Trip preferences
          </span>
          <span>{collapsed ? "Show" : "Hide"}</span>
        </button>
      )}

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          <div>
            <label className="text-[11px] text-miro-ink-subtle uppercase tracking-wide font-medium">
              Team
            </label>
            <select
              value={prefs.team}
              onChange={(e) => set("team", e.target.value)}
              className="mt-1.5 w-full rounded-xl bg-white border border-miro-border px-3 py-2 text-sm text-miro-ink focus:outline-none focus:border-miro-purple focus:ring-2 focus:ring-miro-purple/10"
            >
              {TEAMS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-miro-ink-subtle uppercase tracking-wide font-medium">
                Crowd vibe
              </span>
              <span className="text-miro-purple font-semibold">{crowdLabel}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={prefs.crowd}
              onChange={(e) => set("crowd", Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-miro-bg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-miro-ink-subtle mt-1">
              <span>Quiet</span>
              <span>Party</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-miro-ink-subtle uppercase tracking-wide font-medium">
                Max travel
              </span>
              <span className="text-miro-ink font-medium">{prefs.maxTravelMin} min</span>
            </div>
            <input
              type="range"
              min={15}
              max={90}
              step={5}
              value={prefs.maxTravelMin}
              onChange={(e) => set("maxTravelMin", Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-miro-bg cursor-pointer"
            />
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

          <p className="text-[10px] text-miro-ink-subtle">
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
          ? "bg-miro-purple-soft border-miro-purple/30 text-miro-purple"
          : "bg-white border-miro-border text-miro-ink-muted hover:border-miro-ink-subtle"
      }`}
    >
      {label}
    </button>
  );
}
