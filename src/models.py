"""
Unified Event model.

All three API clients (Ticketmaster, NYC Open Data, Eventbrite) normalize
their responses into this dataclass so downstream consumers get a consistent
schema regardless of the source.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any


@dataclass
class Event:
    """A single event normalized from any source."""

    # Identity
    id: str                          # Source-prefixed ID, e.g. "tm:abc123", "nyc:907841", "eb:456"
    source: str                      # "ticketmaster" | "nyc_open_data" | "eventbrite"
    name: str

    # Timing
    start_time: datetime
    end_time: datetime | None = None

    # Details
    description: str | None = None
    category: str | None = None      # Normalized: "Sports", "Music", "Community", etc.

    # Location
    venue_name: str | None = None
    address: str | None = None
    borough: str | None = None       # NYC-specific (Manhattan, Brooklyn, etc.)
    latitude: float | None = None
    longitude: float | None = None

    # Links & media
    url: str | None = None           # Link to event page on source platform
    image_url: str | None = None     # Thumbnail or banner image

    # Raw API response (for debugging / downstream enrichment)
    raw: dict[str, Any] = field(default_factory=dict, repr=False)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a JSON-friendly dictionary."""
        d = asdict(self)
        # Convert datetimes to ISO strings
        if self.start_time:
            d["start_time"] = self.start_time.isoformat()
        if self.end_time:
            d["end_time"] = self.end_time.isoformat()
        return d

    def __str__(self) -> str:
        end = f" – {self.end_time:%H:%M}" if self.end_time else ""
        venue = f" @ {self.venue_name}" if self.venue_name else ""
        return f"[{self.source}] {self.name} | {self.start_time:%Y-%m-%d %H:%M}{end}{venue}"
