-- World Cup 2026 Fan Travel Planner — Supabase schema (Postgres + PostGIS)
-- Mirrors the domain types in src/types. Swapping SeedRepo for a Supabase
-- repo reads from these tables; the Repo interface stays identical.

create extension if not exists postgis;

-- ── Teams ────────────────────────────────────────────────────
create table if not exists teams (
  code text primary key,                 -- 'FRA','SEN','BRA','ENG','MEX'
  name text not null,
  flag text not null,
  commentary_languages text[] not null default '{}'
);

-- ── Matches ──────────────────────────────────────────────────
create table if not exists matches (
  id text primary key,
  home_team text not null references teams(code),
  away_team text not null,
  venue_name text not null,
  venue geography(Point, 4326) not null,
  kickoff timestamptz not null,
  stage text not null,
  city text not null
);
create index if not exists matches_kickoff_idx on matches (kickoff);
create index if not exists matches_venue_gix on matches using gist (venue);

-- ── Venues ───────────────────────────────────────────────────
create table if not exists venues (
  id text primary key,
  name text not null,
  location geography(Point, 4326) not null,
  address text not null,
  neighborhood text not null,
  tags text[] not null default '{}',
  teams text[] not null default '{}',
  vibe text[] not null default '{}',
  shows_commentary_languages text[] not null default '{}',
  capacity_hint text,
  has_outdoor_seating boolean default false
);
create index if not exists venues_location_gix on venues using gist (location);
create index if not exists venues_teams_idx on venues using gin (teams);

-- ── Diaspora cells ───────────────────────────────────────────
create table if not exists diaspora_cells (
  id text primary key,
  team text not null references teams(code),
  neighborhood text not null,
  center geography(Point, 4326) not null,
  density double precision not null check (density between 0 and 1),
  radius_km double precision not null
);
create index if not exists diaspora_center_gix on diaspora_cells using gist (center);

-- ── Live events (watch parties) ──────────────────────────────
-- Honest confidence ladder enforced at the column level.
create table if not exists events (
  id text primary key,
  title text not null,
  venue_id text references venues(id),
  venue_name text not null,
  location geography(Point, 4326) not null,
  team text not null references teams(code),
  match_id text references matches(id),
  start_time timestamptz not null,
  source text not null check (source in ('eventbrite','luma','reddit','seed','manual')),
  url text,
  confidence text not null check (confidence in ('confirmed','community','likely','backup')),
  commentary_language text,
  tags text[] not null default '{}',
  ingested_at timestamptz not null default now(),
  -- Natural key for idempotent upsert during ingest (Phase 3).
  dedupe_key text unique
);
create index if not exists events_team_idx on events (team);
create index if not exists events_match_idx on events (match_id);
create index if not exists events_location_gix on events using gist (location);

-- ── Helper: nearest venues for a team within a radius ────────
create or replace function venues_near(
  p_team text,
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision
) returns setof venues as $$
  select *
  from venues
  where p_team = any(teams)
    and st_dwithin(
      location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    );
$$ language sql stable;
