"""
Configuration for FIFA NYC event data integration.

Loads API keys from environment variables or a .env file.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env file from project root (two levels up from this file)
_project_root = Path(__file__).resolve().parent.parent
_env_path = _project_root / ".env"
if _env_path.exists():
    load_dotenv(_env_path)


# ---------------------------------------------------------------------------
# API Keys
# ---------------------------------------------------------------------------

TICKETMASTER_API_KEY: str = os.getenv("TICKETMASTER_API_KEY", "")
EVENTBRITE_PRIVATE_TOKEN: str = os.getenv("EVENTBRITE_PRIVATE_TOKEN", "")
NYC_OPEN_DATA_APP_TOKEN: str = os.getenv("NYC_OPEN_DATA_APP_TOKEN", "")


# ---------------------------------------------------------------------------
# Default search parameters — NYC + FIFA
# ---------------------------------------------------------------------------

DEFAULT_CITY = "New York"
DEFAULT_STATE_CODE = "NY"
DEFAULT_COUNTRY_CODE = "US"

# FIFA-related keywords used across all clients
# Intentionally excludes generic "soccer" / "football" to avoid noise
# like field bookings ("Soccer - Non Regulation", etc.)
FIFA_KEYWORDS: list[str] = [
    "FIFA",
    "World Cup",
    "Fan Fest",
    "Fan Zone",
    "Watch Party",
    "FWC",
    "Copa Mundial",
    "FWC26",
    "FIFA26",
]


# ---------------------------------------------------------------------------
# API base URLs
# ---------------------------------------------------------------------------

TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2"
EVENTBRITE_BASE_URL = "https://www.eventbriteapi.com/v3"
NYC_OPEN_DATA_BASE_URL = "https://data.cityofnewyork.us/resource"

# NYC Open Data dataset IDs
NYC_PERMITTED_EVENTS_DATASET = "tvpp-9vvx"
