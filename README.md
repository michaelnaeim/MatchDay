# World Cup Fan Travel Planner

A match-aware trip planner for tourists visiting the US during FIFA World Cup 2026. Tell the app your team, your constraints, and where you are — it finds **where fans like you are gathering**, **real watch parties**, **quieter backups**, and **how to get there**.

> **Core question:** France plays in New Jersey today — *where will French fans watch, party, and how do I plan my day around it?*

---

## Table of contents

1. [Product overview](#product-overview)
2. [What makes this different](#what-makes-this-different)
3. [System architecture](#system-architecture)
4. [How fan gathering prediction works](#how-fan-gathering-prediction-works)
5. [Free & live data sources](#free--live-data-sources)
6. [Data models](#data-models)
7. [Backend](#backend)
8. [Frontend](#frontend)
9. [Agent layer](#agent-layer)
10. [Live event ingestion pipeline](#live-event-ingestion-pipeline)
11. [Implementation steps (in order)](#implementation-steps-in-order)
12. [MVP scope & demo script](#mvp-scope--demo-script)
13. [Hackathon: Miro + Kiro integration](#hackathon-miro--kiro-integration)
14. [What we do not build](#what-we-do-not-build)
15. [Free hosting stack](#free-hosting-stack)

---

## Product overview

### User stories

| Persona | Query |
|---------|-------|
| French tourist in Manhattan | *"France plays in NJ today. Where are French fans? I want commentary in French."* |
| Group of 4 | *"2 want the party, 1 hates lines, 1 needs step-free access — Brooklyn, 7pm kickoff."* |
| Night-shift worker | *"I get off at 7:58pm. Can I still watch? Where + route?"* |
| Local (not watching) | *"Brazil plays — how do I get home through the chaos?"* |

### Core outputs

1. **Watch Contract** — one plan: primary venue, backup, peak arrival time, transit warnings
2. **Live events** — real watch parties from Eventbrite, Luma, ICS, Reddit (refreshed on a schedule)
3. **Route** — directions avoiding crush zones (e.g. Penn Station on MetLife match days)
4. **Trip day** — optional multi-stop itinerary (meal → watch party → quiet spot)

---

## What makes this different

| Generic travel / maps app | This app |
|---------------------------|----------|
| "Restaurants near me" | **"Where will fans of my team be tonight?"** |
| Generic busy times | **Match + team + kickoff + diaspora geography** |
| Static POI list | **Live events + curated fan intelligence** |
| One recommendation | **Party vs quiet vs confirmed watch party** |

We do **not** track GPS of fans. We **infer gatherings** from:

- Diaspora neighborhood clusters
- French-tagged (or team-tagged) venues
- **Real events** polled from free APIs and public pages
- Match-day rules (stadium corridor, peak = kickoff − 45 min)

---

## System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  Next.js / React  •  Map (Leaflet/Mapbox)  •  Chat + itinerary  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     API (Next.js routes / FastAPI)               │
│  /matches  /gatherings  /events  /route  /trip-day  /agent      │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Scoring engine│   │ Agent (LLM)   │   │ Routing       │
│ fan clusters  │   │ tool calling  │   │ OSRM / ORS    │
│ venues events │   │ Kiro / Groq   │   │ Mapbox free   │
└───────┬───────┘   └───────────────┘   └───────────────┘
        │
┌───────▼───────────────────────────────────────────────────────┐
│  DATABASE (Supabase free / SQLite)                             │
│  matches • venues • fan_clusters • events • user_trips         │
└───────▲───────────────────────────────────────────────────────┘
        │
┌───────┴───────────────────────────────────────────────────────┐
│  INGEST WORKER (cron every 15–60 min — GitHub Actions/Replit)  │
│  Eventbrite API • Luma JSON-LD • ICS feeds • Reddit API        │
└────────────────────────────────────────────────────────────────┘
```

---

## How fan gathering prediction works

### Four layers (use all)

```
Layer 4: Community signals (Reddit — optional boost)
Layer 3: Live events (Eventbrite, Luma, ICS)     ← strongest proof
Layer 2: Venue affinity (curated tagged venues)
Layer 1: Diaspora geography (neighborhood weights)
         ↓
    SCORING ENGINE → ranked gatherings + confidence label
```

### Scoring formula (free — no paid crowd APIs)

```python
def score_gathering(venue, event, match, user):
    score = 0

    if user.team in venue.team_affinity:
        score += 35

    score += 25 * cluster_weight(venue.location, team=user.team)

    if event and event.team == user.team and event.same_day_as(match):
        score += 30  # biggest boost — confirmed watch party

    if match.is_near_stadium(venue) and match.is_today:
        score += 20

    if user.language in venue.languages:
        score += 10

    score -= distance_km(user.location, venue) * 2
    if user.hates_lines and venue.expected_crowd == "high":
        score -= 15

    return score
```

### Confidence labels (show in UI — be honest)

| Label | Meaning |
|-------|---------|
| **Confirmed** | Live event listing (Eventbrite, Luma, ICS) |
| **Community** | Reddit / user submission today |
| **Likely** | Team-tagged venue + match day + cluster |
| **Backup** | Same team affinity, quieter vibe |

### Peak time (free math)

```python
peak_arrival = kickoff_time - timedelta(minutes=45)
```

---

## Free & live data sources

### Tier 1 — No API key (curated + open data)

| Source | Use | How |
|--------|-----|-----|
| `matches.json` | Schedule, stadium, kickoff | FIFA.com, Wikipedia |
| `fan_clusters.json` | Where diaspora concentrates | US Census ACS (B05006), manual research |
| `venues.json` | Tagged bars/restaurants | Google search, Yelp (browser), call venues |
| OpenStreetMap / Overpass | Find bars, coords | Free Overpass API |
| Wikidata | Stadium lat/lng | SPARQL, no key |
| MTA / NJ Transit GTFS | Static transit schedules | Free developer downloads |
| OSRM / OpenRouteService | Routing | Free tier |

### Tier 2 — Free tier (signup, $0 within limits)

| Source | Use | Refresh |
|--------|-----|---------|
| **Eventbrite API** | Search public watch parties | Every 30 min |
| **Meetup API** | Group events | Every 60 min |
| **Luma public URLs** | Parse JSON-LD `Event` schema | Every 60 min |
| **ICS / Google Calendar feeds** | Embassy, cultural centers | Every 15 min |
| **Reddit API** | Same-day watch party posts | Every 60 min |
| **Nominatim** | Geocode (run once, cache) | One-time |
| **Mapbox** | Map tiles + directions | 50k loads/mo free |
| **Supabase** | Postgres + PostGIS | Free tier |
| **Groq / Gemini / Ollama** | Agent LLM | Free tier / local |

### What does NOT exist for free

- Live GPS of fans by nationality
- Google Popular Times at scale (ToS + not team-specific)
- Instagram / TikTok location feeds
- Reliable "how busy is this bar right now" API

---

## Data models

### `matches.json`

```json
{
  "id": "wc2026-fra-ury-r32",
  "home": "FRA",
  "away": "URY",
  "kickoff_utc": "2026-06-28T23:00:00Z",
  "venue_id": "metlife",
  "venue_name": "MetLife Stadium",
  "city": "East Rutherford, NJ",
  "lat": 40.8135,
  "lng": -74.0745
}
```

### `fan_clusters.json`

```json
{
  "team": "FRA",
  "metro": "NYC",
  "neighborhoods": [
    {
      "name": "Yorkville",
      "lat": 40.773,
      "lng": -73.954,
      "weight": 0.85,
      "notes": "French restaurants, francophone crowd"
    },
    {
      "name": "Meadowlands corridor",
      "lat": 40.79,
      "lng": -74.06,
      "weight": 0.95,
      "match_day_only": true,
      "notes": "Pre/post match near MetLife"
    }
  ]
}
```

### `venues.json`

```json
{
  "id": "venue-001",
  "name": "Example French Bistro",
  "lat": 40.773,
  "lng": -73.954,
  "team_affinity": ["FRA"],
  "culture_tags": ["french", "francophone"],
  "languages": ["fr", "en"],
  "vibe": "chill",
  "noise": "moderate",
  "screens_world_cup": true,
  "kitchen_close": "22:00",
  "ada_accessible": true,
  "price": "$$",
  "source_url": "https://..."
}
```

### `events` (database table — ingested live)

```json
{
  "id": "evt-123",
  "source": "eventbrite",
  "source_url": "https://www.eventbrite.com/...",
  "title": "Les Bleus Watch Party — France vs Uruguay",
  "team_tags": ["FRA"],
  "start": "2026-06-28T18:00:00-04:00",
  "end": "2026-06-28T21:00:00-04:00",
  "lat": 40.79,
  "lng": -74.06,
  "venue_name": "Example Bar",
  "fetched_at": "2026-06-28T14:00:00Z",
  "confidence": "confirmed"
}
```

### Watch Contract (API response)

```json
{
  "match": { "home": "FRA", "kickoff": "...", "venue": "MetLife Stadium" },
  "updated_at": "2026-06-28T14:12:00Z",
  "primary": {
    "label": "Confirmed",
    "name": "Les Bleus Watch Party",
    "source": "eventbrite",
    "arrive_by": "2026-06-28T17:15:00-04:00",
    "expected_crowd": "high",
    "languages": ["fr", "en"]
  },
  "backup": { "name": "...", "label": "Likely", "why": "French venue, quieter" },
  "transit_warning": "Avoid Penn Station 5:30–9pm — MetLife match day",
  "route": { "duration_min": 42, "steps": ["..."] }
}
```

---

## Backend

### Recommended stack

| Piece | Choice |
|-------|--------|
| Runtime | Node.js (Next.js API routes) **or** Python (FastAPI) |
| Database | Supabase (Postgres + PostGIS) or SQLite for local MVP |
| ORM | Prisma / Drizzle / SQLAlchemy |
| Cron worker | GitHub Actions scheduled workflow or Replit |
| HTTP client | `httpx` (Python) or `fetch` (Node) |

### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/matches` | `?team=FRA&date=2026-06-28` |
| `GET` | `/api/gatherings` | Scored venues + events for team/location |
| `GET` | `/api/events/live` | Events fetched in last 60 min |
| `POST` | `/api/watch-contract` | Full plan for one user query |
| `POST` | `/api/route` | Origin, dest, depart_at, avoid hubs |
| `POST` | `/api/trip-day` | Multi-stop day itinerary |
| `POST` | `/api/agent` | Chat → tool calls → structured response |
| `POST` | `/api/events/submit` | User submits Luma/event URL |

### Core services

```
src/
  services/
    match_service.py       # load matches, "who plays today"
    fan_cluster_service.py # neighborhood weights
    venue_service.py       # geo query venues by team
    event_service.py       # live events from DB
    scoring_service.py     # score_gathering()
    routing_service.py     # OSRM / OpenRouteService
    watch_contract.py      # assemble primary + backup + warnings
  ingest/
    eventbrite.py
    luma_jsonld.py
    ics_feed.py
    reddit.py
    normalize.py           # → common event schema
    dedupe.py
  agent/
    tools.py               # function definitions for LLM
    orchestrator.py
```

### PostGIS geo query example

```sql
SELECT
  v.*,
  ST_Distance(
    v.location::geography,
    ST_MakePoint($lng, $lat)::geography
  ) AS dist_m
FROM venues v
WHERE $team = ANY(v.team_affinity)
ORDER BY dist_m
LIMIT 20;
```

### Routing (free)

```python
# OpenRouteService — free tier, 2000 req/day
# GET /v2/directions/driving-car?start=lng,lat&end=lng,lat

# Or OSRM public demo (dev only):
# GET https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}
```

Custom rule: if `match.venue_id == "metlife"` and `depart_hour` in rush window, add penalty for routes through Penn Station.

---

## Frontend

### Recommended stack

| Piece | Choice |
|-------|--------|
| Framework | Next.js 14+ (App Router) |
| Map | Leaflet + OpenStreetMap tiles **or** Mapbox GL (free tier) |
| UI | Tailwind + shadcn/ui |
| State | React Query for API polling |
| Deploy | Vercel or Replit (live URL for hackathon) |

### Pages / views

```
/                     → Home: pick team + city + date
/plan                 → Chat or form → Watch Contract
/map                  → Pins: confirmed / likely / backup
/trip/[day]           → Timeline itinerary
/events               → Live events list ("Updated 12 min ago")
```

### Key UI components

1. **Team picker** — flag + team code (FRA, MEX, BRA, …)
2. **Intent toggle** — Party / Authentic / Quiet / Survival (not watching)
3. **Watch Contract card** — primary, backup, arrive-by, transit warning
4. **Map pins** — color by confidence (confirmed = green, likely = yellow)
5. **Live badge** — `Updated X min ago` from `events.fetched_at`
6. **Route panel** — steps + "avoid Penn" note when applicable

### Polling live events (frontend)

```typescript
// Refetch live events every 5 min while user is on page
useQuery({
  queryKey: ['events', team, date],
  queryFn: () => fetch(`/api/events/live?team=${team}`),
  refetchInterval: 5 * 60 * 1000,
});
```

---

## Agent layer

The LLM **orchestrates** — it does not invent venues. It calls your backend tools.

### Tool definitions

```python
TOOLS = [
    {
        "name": "get_matches",
        "description": "Get World Cup matches for a team on a date near a city",
        "parameters": {"team": "str", "date": "str", "metro": "str"},
    },
    {
        "name": "find_fan_gatherings",
        "description": "Rank venues and live events where fans of a team gather",
        "parameters": {
            "team": "str",
            "lat": "float",
            "lng": "float",
            "intent": "party|quiet|authentic",
            "language": "str|null",
        },
    },
    {
        "name": "build_watch_contract",
        "description": "Return primary venue, backup, arrive-by, warnings",
        "parameters": {"team": "str", "match_id": "str", "user_prefs": "object"},
    },
    {
        "name": "plan_route",
        "description": "Directions from A to B at a given time",
        "parameters": {
            "origin_lat": "float",
            "origin_lng": "float",
            "dest_lat": "float",
            "dest_lng": "float",
            "depart_at": "iso8601",
            "avoid_hubs": ["penn_station"],
        },
    },
]
```

### Example agent flow

```
User: "France plays in NJ today. I'm in Chelsea. French audio. Hate lines."

1. get_matches(team="FRA", date=today, metro="NYC")
2. find_fan_gatherings(team="FRA", lat=40.746, lng=-74.001, intent="party", language="fr")
3. build_watch_contract(...)
4. plan_route(origin=user, dest=primary_venue, depart_at=peak-45min)

→ Render Watch Contract + map pins
```

---

## Live event ingestion pipeline

### Overview

Poll free sources on a schedule → normalize → dedupe → insert into `events` table.

```
Every 30 min:  Eventbrite search (World Cup + team names + NYC/NJ geo)
Every 60 min:  Luma URLs (JSON-LD parser) + Meetup + Reddit
Every 15 min:  ICS calendar feeds
```

### Eventbrite (primary live source)

```bash
# 1. Create free account: https://www.eventbrite.com/platform/api
# 2. Set EVENTBRITE_TOKEN in .env
```

```python
# ingest/eventbrite.py
import httpx, os

def search_watch_parties(query: str, lat: float, lng: float, radius_km: str = "50km"):
    r = httpx.get(
        "https://www.eventbriteapi.com/v3/events/search/",
        headers={"Authorization": f"Bearer {os.environ['EVENTBRITE_TOKEN']}"},
        params={
            "q": query,
            "location.latitude": lat,
            "location.longitude": lng,
            "location.within": radius_km,
            "expand": "venue",
        },
        timeout=30,
    )
    r.raise_for_status()
    return normalize_eventbrite(r.json())
```

Search queries to rotate:

- `France World Cup`, `Les Bleus`, `World Cup watch party`
- Per team: `{country} World Cup watch`, `{team name} fan`

### Luma / any public event page (JSON-LD)

```python
# ingest/luma_jsonld.py
import json, re, httpx

def fetch_schema_event(url: str) -> dict | None:
    html = httpx.get(url, timeout=15, follow_redirects=True).text
    for block in re.findall(
        r'<script type="application/ld\+json">(.*?)</script>', html, re.S
    ):
        data = json.loads(block)
        event = extract_event_type(data)  # handle @graph, single Event
        if event:
            return normalize_schema_event(event, source_url=url)
    return None
```

Maintain `luma_watchlist.txt` — one URL per line. Add user submissions via `/api/events/submit`.

### ICS calendar feeds

```python
# pip install icalendar
from icalendar import Calendar

def poll_ics(url: str) -> list[dict]:
    cal = Calendar.from_ical(httpx.get(url).content)
    return [normalize_ics_component(e) for e in cal.walk("VEVENT")]
```

### Reddit (community layer)

```python
# Free Reddit API — search r/nyc r/nj r/soccer
# Keywords: "watch party", "France", "Les Bleus", "World Cup"
# Label confidence: "community" — show caveat in UI
```

### Dedupe rules

Same event if:

- Same `source_url`, OR
- Same `venue_name` + `start` within 30 min + overlapping `team_tags`

### GitHub Actions cron (free worker)

```yaml
# .github/workflows/ingest-events.yml
name: Ingest live events
on:
  schedule:
    - cron: "*/30 * * * *"  # every 30 min
  workflow_dispatch:

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install httpx icalendar
      - run: python scripts/run_ingest.py
        env:
          EVENTBRITE_TOKEN: ${{ secrets.EVENTBRITE_TOKEN }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

---

## Implementation steps (in order)

### Phase 0 — Setup (Day 1)

- [ ] Create repo / `world-cup-planner` folder
- [ ] Init Next.js: `npx create-next-app@latest . --typescript --tailwind --app`
- [ ] Create Supabase project (free) — enable PostGIS extension
- [ ] Add `.env.example`:

```env
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Live events (free tiers)
EVENTBRITE_TOKEN=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# Maps / routing (optional for MVP)
MAPBOX_TOKEN=
OPENROUTESERVICE_API_KEY=

# Agent
GROQ_API_KEY=
# or use Kiro in hackathon environment
```

- [ ] Seed `data/matches.json`, `fan_clusters.json`, `venues.json` (France first)

### Phase 1 — Backend core (Day 1–2)

- [ ] Run DB migrations: `matches`, `venues`, `fan_clusters`, `events`
- [ ] Implement `scoring_service.py` — `score_gathering()`
- [ ] Implement `GET /api/matches`
- [ ] Implement `GET /api/gatherings?team=FRA&lat=...&lng=...`
- [ ] Implement `POST /api/watch-contract`
- [ ] Write unit tests for scoring (France + MetLife match day)

### Phase 2 — Live ingest (Day 2–3)

- [ ] Eventbrite developer account + `ingest/eventbrite.py`
- [ ] JSON-LD parser + `luma_watchlist.txt`
- [ ] `scripts/run_ingest.py` — normalize + upsert to Supabase
- [ ] GitHub Actions cron OR Replit always-on worker
- [ ] `GET /api/events/live` — `WHERE fetched_at > now() - interval '1 hour'`
- [ ] Show **"Updated X min ago"** in UI

### Phase 3 — Routing (Day 3)

- [ ] Geocode all venues once → store lat/lng (Nominatim or manual)
- [ ] `POST /api/route` via OpenRouteService or OSRM
- [ ] Add Penn Station / MetLife avoidance rules
- [ ] Attach route to Watch Contract response

### Phase 4 — Frontend (Day 3–4)

- [ ] Home: team + location + intent form
- [ ] Watch Contract results page
- [ ] Leaflet/Mapbox map with colored pins
- [ ] Live events sidebar
- [ ] Chat UI wired to `/api/agent` (optional but strong for hackathon)

### Phase 5 — Agent (Day 4)

- [ ] Define tools in `agent/tools.py`
- [ ] `POST /api/agent` — LLM calls tools, returns structured JSON
- [ ] System prompt: never invent venues; only use tool results
- [ ] Test demo queries (France in NJ, group treaty, quiet backup)

### Phase 6 — Deploy (Day 4–5)

- [ ] Deploy frontend to Vercel or Replit → **live URL**
- [ ] Supabase production DB
- [ ] Secrets in Vercel / GitHub Actions
- [ ] Smoke test: full flow on mobile

### Phase 7 — Data refresh (ongoing)

- [ ] Curate 5 teams × 20 venues (France, Mexico, Brazil, USA, Argentina)
- [ ] Add 10 real Luma/Eventbrite URLs per team when available
- [ ] Subscribe to 1–2 ICS feeds (Alliance Française, etc.)
- [ ] Weekly: refresh `matches.json` from FIFA schedule

---

## MVP scope & demo script

### In scope (ship this)

- NYC + New Jersey metro only
- 5 teams fully curated
- 25+ venues, 10+ live event sources
- Watch Contract + map + route + live events badge
- Eventbrite ingest + JSON-LD poller
- One chat agent with tools

### Out of scope (mention as roadmap)

- Live GPS / crowd heatmaps
- Payments, accounts, social graph
- All 48 teams / all US host cities
- Native mobile app

### 30-second demo

1. Show Miro board (personas + map pins) if hackathon requires it
2. Open live URL
3. Query: *"France plays in New Jersey today. I'm in Chelsea. French commentary. Hate lines."*
4. Show:
   - **Confirmed** Eventbrite/Luma watch party
   - **Likely** French venue backup
   - Route + "avoid Penn Station"
   - **"Updated 14 min ago"**

4. Second query: *"4 friends — 2 want party, 1 quiet, 1 wheelchair — Brooklyn, 7pm kickoff."*

---

## Hackathon: Miro + Kiro integration

### Miro board frames (build before coding)

| Frame | Contents |
|-------|----------|
| **Personas** | French tourist, group of 4, night-shift worker, local survival |
| **JTBD** | "Where is my country tonight?" / "Will I make kickoff?" |
| **City map** | Pins for venues + fan clusters (Yorkville, Meadowlands) |
| **Data sources** | Eventbrite, Luma, ICS, venues.json, matches.json |
| **Wireframe** | Watch Contract card + map + live badge |
| **Agent tools** | List of 4 tools with parameters |
| **Out of scope** | No GPS tracking, no payments |

### Integration story (for judges)

> "We designed personas and data rules on Miro. Kiro read the board via Miro MCP and generated the app structure. The agent calls our live event pipeline — not hallucinated bars."

### Scoring alignment

| Criterion | How this project scores |
|-----------|-------------------------|
| Innovation | Match-aware fan intelligence + Watch Contract agent |
| Impact | Tourists, diaspora, accessibility, World Cup scale |
| Tool usage | Miro = spec; Kiro = builder |
| Functional MVP | Live URL, working query, real events when available |
| Integration flow | Miro board → Kiro read → deployed app |

---

## What we do not build

- Scraping Google Popular Times at scale
- Claiming "400 French people are here now" without source
- Instagram / TikTok location scraping
- Paid sports data or crowd APIs
- Mystery-bag / discount food (that's Too Good To Go)

---

## Free hosting stack

| Component | Service | Cost |
|-----------|---------|------|
| Frontend + API | Vercel or Replit | $0 |
| Database | Supabase | $0 tier |
| Cron ingest | GitHub Actions | $0 |
| Maps | Leaflet + OSM or Mapbox free tier | $0 |
| Routing | OpenRouteService | $0 tier |
| LLM | Groq / Gemini / Kiro / Ollama | $0 |
| Event data | Eventbrite + JSON-LD + ICS + Reddit | $0 |

---

## Project structure (suggested)

```
world-cup-planner/
├── README.md                 ← this file
├── .env.example
├── data/                     # seed JSON (git)
│   ├── matches.json
│   ├── fan_clusters.json
│   └── venues.json
├── scripts/
│   ├── run_ingest.py
│   ├── seed_db.py
│   └── geocode_venues.py
├── ingest/
│   ├── eventbrite.py
│   ├── luma_jsonld.py
│   ├── ics_feed.py
│   ├── reddit.py
│   ├── normalize.py
│   └── dedupe.py
├── src/
│   ├── app/                  # Next.js pages (or separate frontend/)
│   ├── services/
│   └── agent/
├── .github/workflows/
│   └── ingest-events.yml
└── luma_watchlist.txt
```

---

## Quick start (after scaffold)

```bash
# 1. Install
npm install
pip install httpx icalendar python-dotenv  # if using Python ingest

# 2. Configure
cp .env.example .env
# Fill Supabase + Eventbrite tokens

# 3. Seed database
python scripts/seed_db.py

# 4. Run ingest once
python scripts/run_ingest.py

# 5. Start app
npm run dev
# → http://localhost:3000
```

---

## One-line pitch

> **We poll real watch parties for free, combine them with diaspora geography and match-day rules, and deliver a Watch Contract — where fans like you are gathering, and how to get there before kickoff.**
