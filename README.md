## Mira x Kira Hackathon

# Matchday — World Cup 2026 Fan Travel Planner

A fan enters their **team**, **location**, and **intent**, and gets back a
**Watch Contract**: a primary venue, a contrasting backup (party ⇄ quiet), an
arrive-by time (kickoff − 45 min), a transit warning, and a route.

Recommendations come from a **transparent scoring engine** over diaspora
geography + tagged venues + live watch-party events. Nothing is hallucinated —
every point a venue earns is recorded in a `reasons[]` breakdown, and the agent
may only surface venues/events that the data layer actually returned.

> MVP scope: NYC + New Jersey metro, 5 teams (FRA/SEN/BRA/ENG/MEX), all $0
> free-tier services. Confidence is honest: **confirmed > community > likely > backup**.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Supabase** (Postgres + PostGIS) — swappable behind the `Repo` interface
- **Tailwind** + shadcn-style UI
- **Leaflet / OpenStreetMap** map
- **Groq** for the tool-calling agent
- Deploy target: **Vercel**

## Architecture

Everything depends only on the `Repo` interface (`src/services/repo.ts`), which
defaults to seed JSON in `/data`. Swapping to Supabase is a one-file change.

```
src/
  types/                 Domain contract (Match, Venue, FanEvent, WatchContract, …)
  lib/geo.ts             Haversine, radius, point-to-polyline (Penn proximity)
  lib/supabase.ts        Server admin client (returns null when unconfigured)
  services/
    repo.ts              Repo interface + SeedRepo (the $0 default) + factory
    scoring_service.ts   Transparent scoring engine → ScoredVenue + reasons[]
    watch_contract.ts    Assembles the Watch Contract (primary/backup/arrive-by)
    gatherings_service.ts "Where are my people watching?"
    routing_service.ts   OSRM/ORS wrapper + MetLife/Penn Station rule
data/                    Seed JSON (teams, matches, venues, diaspora, events)
supabase/schema.sql      Postgres + PostGIS schema mirroring the types
scripts/seed.ts          Seed Supabase from /data
```

## Develop

```bash
npm install
cp .env.example .env.local   # all blanks work; app falls back to seed data
npm test                     # vitest
npm run dev                  # http://localhost:3000
```

### Optional services (all free tier)

- **Supabase**: set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `USE_SUPABASE=true`, then `npm run seed`.
- **Groq agent**: set `GROQ_API_KEY`.
- **Routing**: defaults to the public OSRM demo; set `OPENROUTESERVICE_API_KEY`
  to use ORS instead.

## Build phases

1. ✅ Backend spine (types, geo, scoring, watch contract, repo, schema, seed, tests)
2. API routes — `/api/matches`, `/api/gatherings`, `/api/watch-contract`, `/api/route`
3. Frontend — form, Watch Contract card, Leaflet map, live-events panel
4. Live ingest — Eventbrite + Luma + Reddit → Supabase (seed JSON stays as fallback)
5. Routing — OSRM/ORS + Penn Station penalty
6. Agent — Groq tool-calling over the four services
