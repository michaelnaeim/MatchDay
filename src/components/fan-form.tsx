"use client";

import { useState } from "react";
import type { Intent, TeamCode } from "@/types";
import { LOCATIONS, PERSONAS, locationById, type Persona } from "@/lib/locations";
import { cn } from "@/lib/utils";

export interface FanFormState {
  team: TeamCode;
  matchId: string;
  locationId: string;
  intent: Intent;
  commentaryLanguage: string;
  avoidTransitHubs: boolean;
}

const INTENTS: { value: Intent; label: string; hint: string }[] = [
  { value: "party", label: "Party", hint: "Loud, crowded, flags" },
  { value: "quiet", label: "Quiet", hint: "Hear the commentary" },
  { value: "authentic", label: "Authentic", hint: "Diaspora local spot" },
  { value: "survival", label: "Survival", hint: "Any screen, fast" },
];

const TEAMS: { code: TeamCode; label: string }[] = [
  { code: "FRA", label: "🇫🇷 France" },
  { code: "SEN", label: "🇸🇳 Senegal" },
  { code: "BRA", label: "🇧🇷 Brazil" },
  { code: "ENG", label: "🏴 England" },
  { code: "MEX", label: "🇲🇽 Mexico" },
];

export function FanForm({
  state,
  onChange,
  onSubmit,
  matches,
  loading,
}: {
  state: FanFormState;
  onChange: (next: FanFormState) => void;
  onSubmit: () => void;
  matches: { id: string; homeTeam: string; awayTeam: string; stage: string }[];
  loading: boolean;
}) {
  const set = <K extends keyof FanFormState>(key: K, value: FanFormState[K]) =>
    onChange({ ...state, [key]: value });

  const applyPersona = (p: Persona) =>
    onChange({
      team: p.team,
      matchId: p.matchId,
      locationId: p.locationId,
      intent: p.intent,
      commentaryLanguage: p.commentaryLanguage ?? "",
      avoidTransitHubs: p.avoidTransitHubs,
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-5 rounded-2xl border border-border bg-card p-5"
    >
      {/* Persona quick-fills */}
      <div>
        <Label>Try a persona</Label>
        <div className="grid grid-cols-2 gap-2">
          {PERSONAS.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => applyPersona(p)}
              title={p.blurb}
              className="rounded-lg border border-border bg-background px-3 py-2 text-left text-xs hover:border-primary"
            >
              <span className="mr-1">{p.emoji}</span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Your team">
          <Select
            value={state.team}
            onChange={(v) => set("team", v as TeamCode)}
            options={TEAMS.map((t) => ({ value: t.code, label: t.label }))}
          />
        </Field>
        <Field label="You're in">
          <Select
            value={state.locationId}
            onChange={(v) => set("locationId", v)}
            options={LOCATIONS.map((l) => ({ value: l.id, label: l.label }))}
          />
        </Field>
      </div>

      <Field label="Match">
        <Select
          value={state.matchId}
          onChange={(v) => set("matchId", v)}
          options={matches.map((m) => ({
            value: m.id,
            label: `${m.homeTeam} v ${m.awayTeam} — ${m.stage}`,
          }))}
        />
      </Field>

      <div>
        <Label>Intent</Label>
        <div className="grid grid-cols-4 gap-2">
          {INTENTS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => set("intent", opt.value)}
              title={opt.hint}
              className={cn(
                "rounded-lg border px-2 py-2 text-center text-xs transition",
                state.intent === opt.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-background hover:border-primary/50",
              )}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {opt.hint}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Commentary language">
          <input
            value={state.commentaryLanguage}
            onChange={(e) => set("commentaryLanguage", e.target.value)}
            placeholder="e.g. French"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Transit">
          <button
            type="button"
            onClick={() => set("avoidTransitHubs", !state.avoidTransitHubs)}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm",
              state.avoidTransitHubs
                ? "border-likely bg-likely/15 text-likely"
                : "border-border bg-background",
            )}
          >
            {state.avoidTransitHubs ? "🚫 Hate lines (avoid hubs)" : "Lines are fine"}
          </button>
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Building your Watch Contract…" : "Get my Watch Contract"}
      </button>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export { locationById };
