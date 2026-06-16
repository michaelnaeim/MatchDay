"""
Ticketmaster Discovery API client for FIFA / World Cup events in NYC.

Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
Free tier: 5 req/s, 5 000 req/day.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import requests

from src.config import (
    TICKETMASTER_API_KEY,
    TICKETMASTER_BASE_URL,
    DEFAULT_CITY,
    DEFAULT_STATE_CODE,
    DEFAULT_COUNTRY_CODE,
    FIFA_KEYWORDS,
)
from src.models import Event

logger = logging.getLogger(__name__)

# TM segment ID → normalized category
_SEGMENT_MAP: dict[str, str] = {
    "KZFzniwnSyZfZ7v7nE": "Sports",
    "KZFzniwnSyZfZ7v7n1": "Community",
    "KZFzniwnSyZfZ7v7nJ": "Music",
    "KZFzniwnSyZfZ7v7na": "Arts & Theatre",
    "KZFzniwnSyZfZ7v7nn": "Film",
}


class TicketmasterClient:
    """Fetch FIFA-related events from the Ticketmaster Discovery API."""

    SOURCE = "ticketmaster"

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or TICKETMASTER_API_KEY
        if not self.api_key:
            raise ValueError(
                "Ticketmaster API key is required. "
                "Set TICKETMASTER_API_KEY in your .env file."
            )
        self.base_url = f"{TICKETMASTER_BASE_URL}/events.json"
        self.session = requests.Session()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def search_events(
        self,
        keywords: list[str] | None = None,
        city: str = DEFAULT_CITY,
        state_code: str = DEFAULT_STATE_CODE,
        country_code: str = DEFAULT_COUNTRY_CODE,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        classification_name: str | None = None,
        page_size: int = 100,
        max_pages: int = 5,
    ) -> list[Event]:
        """
        Search for FIFA-related events in a city.

        Each keyword is searched separately and results are de-duplicated by
        Ticketmaster event ID before returning.
        """
        keywords = keywords or FIFA_KEYWORDS
        seen_ids: set[str] = set()
        events: list[Event] = []

        for keyword in keywords:
            page_events = self._search_keyword(
                keyword=keyword,
                city=city,
                state_code=state_code,
                country_code=country_code,
                start_date=start_date,
                end_date=end_date,
                classification_name=classification_name,
                page_size=page_size,
                max_pages=max_pages,
            )
            for ev in page_events:
                # Dedup across keywords (strip source prefix for TM-internal ID)
                raw_id = ev.id.removeprefix("tm:")
                if raw_id not in seen_ids:
                    seen_ids.add(raw_id)
                    events.append(ev)

        events.sort(key=lambda e: e.start_time)
        logger.info("Ticketmaster: found %d unique FIFA events", len(events))
        return events

    def get_event(self, event_id: str) -> Event:
        """Fetch a single event by its Ticketmaster ID."""
        url = f"{TICKETMASTER_BASE_URL}/events/{event_id}.json"
        resp = self.session.get(url, params={"apikey": self.api_key})
        resp.raise_for_status()
        return self._parse_event(resp.json())

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _search_keyword(
        self,
        keyword: str,
        city: str,
        state_code: str,
        country_code: str,
        start_date: datetime | None,
        end_date: datetime | None,
        classification_name: str | None,
        page_size: int,
        max_pages: int,
    ) -> list[Event]:
        """Paginate through results for a single keyword."""
        events: list[Event] = []

        for page_num in range(max_pages):
            params: dict[str, Any] = {
                "apikey": self.api_key,
                "keyword": keyword,
                "city": city,
                "stateCode": state_code,
                "countryCode": country_code,
                "size": min(page_size, 200),  # TM max is 200
                "page": page_num,
                "sort": "date,asc",
            }

            if classification_name:
                params["classificationName"] = classification_name
            if start_date:
                params["startDateTime"] = start_date.strftime("%Y-%m-%dT%H:%M:%SZ")
            if end_date:
                params["endDateTime"] = end_date.strftime("%Y-%m-%dT%H:%M:%SZ")

            try:
                resp = self.session.get(self.base_url, params=params)
                resp.raise_for_status()
                data = resp.json()
            except requests.RequestException as exc:
                logger.warning("TM request failed for keyword '%s' page %d: %s", keyword, page_num, exc)
                break

            embedded = data.get("_embedded", {})
            raw_events = embedded.get("events", [])
            if not raw_events:
                break

            for raw in raw_events:
                try:
                    events.append(self._parse_event(raw))
                except Exception as exc:
                    logger.debug("Failed to parse TM event: %s", exc)

            # Check if there are more pages
            page_info = data.get("page", {})
            total_pages = page_info.get("totalPages", 1)
            if page_num + 1 >= total_pages:
                break

        return events

    def _parse_event(self, raw: dict[str, Any]) -> Event:
        """Normalize a raw Ticketmaster event dict into a unified Event."""
        event_id = raw["id"]

        # Parse dates
        dates = raw.get("dates", {})
        start_obj = dates.get("start", {})
        start_time = _parse_tm_datetime(start_obj)

        end_obj = dates.get("end", {})
        end_time = _parse_tm_datetime(end_obj) if end_obj else None

        # Venue
        venues = raw.get("_embedded", {}).get("venues", [])
        venue = venues[0] if venues else {}
        venue_name = venue.get("name")
        address_parts = []
        if addr := venue.get("address", {}):
            if line1 := addr.get("line1"):
                address_parts.append(line1)
        if city := venue.get("city", {}).get("name"):
            address_parts.append(city)
        if state := venue.get("state", {}).get("stateCode"):
            address_parts.append(state)
        address = ", ".join(address_parts) if address_parts else None

        location = venue.get("location", {})
        lat = _safe_float(location.get("latitude"))
        lng = _safe_float(location.get("longitude"))

        # Classification → category
        classifications = raw.get("classifications", [])
        category = None
        if classifications:
            primary = classifications[0]
            segment = primary.get("segment", {})
            segment_id = segment.get("id", "")
            category = _SEGMENT_MAP.get(segment_id, segment.get("name"))

        # Image
        images = raw.get("images", [])
        image_url = images[0]["url"] if images else None

        # URL
        url = raw.get("url")

        return Event(
            id=f"tm:{event_id}",
            source=self.SOURCE,
            name=raw.get("name", ""),
            description=raw.get("info") or raw.get("pleaseNote"),
            start_time=start_time,
            end_time=end_time,
            venue_name=venue_name,
            address=address,
            borough=None,  # TM doesn't provide borough
            latitude=lat,
            longitude=lng,
            category=category,
            url=url,
            image_url=image_url,
            raw=raw,
        )


# --------------------------------------------------------------------------
# Utility
# --------------------------------------------------------------------------

def _parse_tm_datetime(dt_obj: dict[str, Any]) -> datetime:
    """Parse a Ticketmaster date/time object into a datetime."""
    if iso := dt_obj.get("dateTime"):
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    # Fallback: localDate + localTime
    local_date = dt_obj.get("localDate", "1970-01-01")
    local_time = dt_obj.get("localTime", "00:00:00")
    return datetime.fromisoformat(f"{local_date}T{local_time}")


def _safe_float(val: Any) -> float | None:
    """Convert a value to float, returning None on failure."""
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None
