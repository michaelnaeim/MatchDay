# 🏟️ Matchday — FIFA NYC Event Data Integration

Pluggable Python modules that fetch **FIFA World Cup 2026** event data in NYC from three sources:

| Source | What it covers | API Key? |
|---|---|---|
| **Ticketmaster** | Matches, concerts, ticketed events | Required (free) |
| **NYC Open Data** | City-permitted events, fan zones, road closures, soccer fields | Not required |
| **Eventbrite** | Watch parties, fan meetups, community events | Required (free) |

All results are normalized into a **unified `Event` schema** so downstream code doesn't care which source an event came from.

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Set up API keys

```bash
cp .env.example .env
# Edit .env and add your keys
```

- **Ticketmaster**: Get a free key at [developer.ticketmaster.com](https://developer.ticketmaster.com/)
- **Eventbrite**: Get a free token at [eventbrite.com/platform](https://www.eventbrite.com/platform/)
- **NYC Open Data**: Works without a key, but [register for a token](https://data.cityofnewyork.us/profile/edit/developer_settings) for higher rate limits

### 3. Run the smoke test

```bash
python3 -m tests.test_fetch
```

## Usage

### Individual clients

```python
from src.ticketmaster.client import TicketmasterClient
from src.nyc_open_data.client import NYCOpenDataClient
from src.eventbrite.client import EventbriteClient

# Ticketmaster
tm = TicketmasterClient()
events = tm.search_events()  # FIFA keywords are the default

# NYC Open Data (no API key needed)
nyc = NYCOpenDataClient()
events = nyc.search_events()

# Eventbrite (needs org IDs in src/eventbrite/seed_ids.py)
eb = EventbriteClient()
events = eb.search_events()
```

### Aggregator — all sources at once

```python
from src.aggregator import fetch_all_events
from datetime import datetime

# Fetch everything
events = fetch_all_events()

# Filter by date range
events = fetch_all_events(
    start_date=datetime(2026, 6, 14),
    end_date=datetime(2026, 7, 19),
)

# Only specific sources
events = fetch_all_events(sources=["ticketmaster", "nyc_open_data"])
```

### Unified Event schema

Every event from every source is normalized into this shape:

```python
Event(
    id="nyc:946389",              # Source-prefixed ID
    source="nyc_open_data",       # "ticketmaster" | "nyc_open_data" | "eventbrite"
    name="Fox World Cup Watcher",
    description=None,
    start_time=datetime(...),
    end_time=datetime(...),
    venue_name="Times Square: ...",
    address=None,
    borough="Manhattan",
    latitude=None,
    longitude=None,
    category="Community",
    url=None,
    image_url=None,
    raw={...},                    # Original API response
)
```

Call `event.to_dict()` for a JSON-serializable version.

## Eventbrite: Adding Organizer IDs

Since Eventbrite's search API is deprecated, you need to add organizer/venue IDs to track. Edit `src/eventbrite/seed_ids.py`:

```python
NYC_ORGANIZER_IDS = [
    "12345678901",  # FIFA Fan Fest NYC
    "98765432101",  # Soccer Bar Watch Parties
]
```

To find IDs: look at an organizer's Eventbrite URL (the number at the end), or use:

```python
eb = EventbriteClient()
orgs = eb.discover_organizations()  # Lists your own orgs
```

## Project Structure

```
matchday/
├── src/
│   ├── config.py                  # API keys, FIFA keywords, defaults
│   ├── models.py                  # Unified Event dataclass
│   ├── aggregator.py              # Merges all sources
│   ├── ticketmaster/client.py     # Ticketmaster Discovery API
│   ├── nyc_open_data/client.py    # NYC Open Data SODA API
│   └── eventbrite/
│       ├── client.py              # Eventbrite org-based API
│       └── seed_ids.py            # Curated organizer/venue IDs
├── tests/test_fetch.py            # Smoke test
├── .env.example                   # API key template
└── requirements.txt
```
