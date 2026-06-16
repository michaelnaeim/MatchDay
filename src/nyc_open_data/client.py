"""
NYC Open Data (SODA API) client for FIFA / World Cup events.

Dataset: NYC Permitted Event Information (tvpp-9vvx)
Docs: https://dev.socrata.com/docs/queries/
No API key required, but an app token gives higher rate limits.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import requests

from src.config import (
    NYC_OPEN_DATA_APP_TOKEN,
    NYC_OPEN_DATA_BASE_URL,
    NYC_PERMITTED_EVENTS_DATASET,
    FIFA_KEYWORDS,
)
from src.models import Event

logger = logging.getLogger(__name__)

# NYC event_type → normalized category
_EVENT_TYPE_MAP: dict[str, str] = {
    "Sport - Youth": "Sports",
    "Sport - Adult": "Sports",
    "Special Event": "Community",
    "Street Activity - Block Party": "Community",
    "Street Activity - Street Fair": "Community",
    "Street Activity - Farmers Market": "Community",
    "Parade": "Community",
}


class NYCOpenDataClient:
    """Fetch FIFA-related city-permitted events from NYC Open Data."""

    SOURCE = "nyc_open_data"

    def __init__(self, app_token: str | None = None) -> None:
        self.app_token = app_token or NYC_OPEN_DATA_APP_TOKEN
        self.base_url = f"{NYC_OPEN_DATA_BASE_URL}/{NYC_PERMITTED_EVENTS_DATASET}.json"
        self.session = requests.Session()
        if self.app_token:
            self.session.headers["X-App-Token"] = self.app_token

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def search_events(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        borough: str | None = None,
        event_type: str | None = None,
        keywords: list[str] | None = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> list[Event]:
        """
        Search for FIFA-related permitted events in NYC.

        Uses SoQL $where clause to filter by date range and keyword matching
        on the event_name field.
        """
        keywords = keywords or FIFA_KEYWORDS
        where_clauses: list[str] = []

        # Date range filtering
        if start_date:
            where_clauses.append(
                f"start_date_time >= '{start_date.strftime('%Y-%m-%dT%H:%M:%S')}'"
            )
        if end_date:
            where_clauses.append(
                f"start_date_time <= '{end_date.strftime('%Y-%m-%dT%H:%M:%S')}'"
            )

        # Borough filter
        if borough:
            where_clauses.append(f"event_borough = '{borough}'")

        # Event type filter
        if event_type:
            where_clauses.append(f"event_type = '{event_type}'")

        # FIFA keyword matching on event_name (case-insensitive via upper())
        keyword_conditions = [
            f"upper(event_name) LIKE '%{kw.upper()}%'"
            for kw in keywords
        ]
        if keyword_conditions:
            where_clauses.append(f"({' OR '.join(keyword_conditions)})")

        params: dict[str, Any] = {
            "$limit": limit,
            "$offset": offset,
            "$order": "start_date_time ASC",
        }
        if where_clauses:
            params["$where"] = " AND ".join(where_clauses)

        try:
            resp = self.session.get(self.base_url, params=params)
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as exc:
            logger.error("NYC Open Data request failed: %s", exc)
            return []

        events = []
        for raw in data:
            try:
                events.append(self._parse_event(raw))
            except Exception as exc:
                logger.debug("Failed to parse NYC event: %s", exc)

        logger.info("NYC Open Data: found %d FIFA events", len(events))
        return events

    def get_event(self, event_id: str) -> Event | None:
        """Fetch a single event by its NYC event ID."""
        params = {"$where": f"event_id = '{event_id}'", "$limit": 1}
        try:
            resp = self.session.get(self.base_url, params=params)
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as exc:
            logger.error("NYC Open Data request failed: %s", exc)
            return None

        if not data:
            return None
        return self._parse_event(data[0])

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _parse_event(self, raw: dict[str, Any]) -> Event:
        """Normalize a raw NYC Open Data event dict into a unified Event."""
        event_id = str(raw.get("event_id", ""))

        # Parse dates
        start_str = raw.get("start_date_time", "")
        start_time = datetime.fromisoformat(start_str) if start_str else datetime.min

        end_str = raw.get("end_date_time", "")
        end_time = datetime.fromisoformat(end_str) if end_str else None

        # Category
        raw_type = raw.get("event_type", "")
        category = _EVENT_TYPE_MAP.get(raw_type, raw_type)

        # Borough
        borough = raw.get("event_borough")

        # Location name
        venue_name = raw.get("event_location")

        return Event(
            id=f"nyc:{event_id}",
            source=self.SOURCE,
            name=raw.get("event_name", ""),
            description=None,  # NYC Open Data doesn't provide descriptions
            start_time=start_time,
            end_time=end_time,
            venue_name=venue_name,
            address=None,  # Not in this dataset
            borough=borough,
            latitude=None,  # Not in this dataset
            longitude=None,
            category=category,
            url=None,  # No event page URL
            image_url=None,
            raw=raw,
        )
