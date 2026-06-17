/**
 * Seed Supabase from the same /data JSON the SeedRepo uses.
 * Idempotent: upserts by primary key. Requires NEXT_PUBLIC_SUPABASE_URL
 * and SUPABASE_SERVICE_ROLE_KEY. Run: `npm run seed`.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type {
  DiasporaCell,
  FanEvent,
  Match,
  Team,
  Venue,
} from "../src/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Aborting.",
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

function load<T>(file: string): T {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "data", file), "utf8"),
  ) as T;
}

const point = (lat: number, lng: number) => `SRID=4326;POINT(${lng} ${lat})`;

async function main() {
  const teams = load<Team[]>("teams.json");
  const matches = load<Match[]>("matches.json");
  const venues = load<Venue[]>("venues.json");
  const diaspora = load<DiasporaCell[]>("diaspora.json");
  const events = load<FanEvent[]>("events.json");

  console.log("Seeding teams…");
  await upsert("teams", teams.map((t) => ({
    code: t.code,
    name: t.name,
    flag: t.flag,
    commentary_languages: t.commentaryLanguages,
  })));

  console.log("Seeding matches…");
  await upsert("matches", matches.map((m) => ({
    id: m.id,
    home_team: m.homeTeam,
    away_team: m.awayTeam,
    venue_name: m.venueName,
    venue: point(m.venue.lat, m.venue.lng),
    kickoff: m.kickoff,
    stage: m.stage,
    city: m.city,
  })));

  console.log("Seeding venues…");
  await upsert("venues", venues.map((v) => ({
    id: v.id,
    name: v.name,
    location: point(v.location.lat, v.location.lng),
    address: v.address,
    neighborhood: v.neighborhood,
    tags: v.tags,
    teams: v.teams,
    vibe: v.vibe,
    shows_commentary_languages: v.showsCommentaryLanguages,
    capacity_hint: v.capacityHint ?? null,
    has_outdoor_seating: v.hasOutdoorSeating ?? false,
  })));

  console.log("Seeding diaspora cells…");
  await upsert("diaspora_cells", diaspora.map((d) => ({
    id: d.id,
    team: d.team,
    neighborhood: d.neighborhood,
    center: point(d.center.lat, d.center.lng),
    density: d.density,
    radius_km: d.radiusKm,
  })));

  console.log("Seeding fallback events…");
  await upsert("events", events.map((e) => ({
    id: e.id,
    title: e.title,
    venue_id: e.venueId ?? null,
    venue_name: e.venueName,
    location: point(e.location.lat, e.location.lng),
    team: e.team,
    match_id: e.matchId ?? null,
    start_time: e.startTime,
    source: e.source,
    url: e.url ?? null,
    confidence: e.confidence,
    commentary_language: e.commentaryLanguage ?? null,
    tags: e.tags,
    ingested_at: e.ingestedAt,
    dedupe_key: e.id,
  })));

  console.log("✓ Seed complete.");
}

async function upsert(table: string, rows: Record<string, unknown>[]) {
  const { error } = await db.from(table).upsert(rows);
  if (error) {
    console.error(`  ✗ ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`  ✓ ${table}: ${rows.length} rows`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
