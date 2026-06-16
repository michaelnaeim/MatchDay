"""
Eventbrite API client for FIFA / World Cup events in NYC.

Since the public search endpoint was deprecated in Dec 2019, this client
queries events by organization ID and/or venue ID. Use seed_ids.py to
configure which organizers and venues to track.

Docs: https://www.eventbrite.com/platform/api/
Free tier: 2 000 req/hr.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import requests

from src.config import (
    EVENTBRITE_PRIVATE_TOKEN,
    EVENTBRITE_BASE_URL,
    FIFA_KEYWORDS,
)
from src.eventbrite.seed_ids import NYC_ORGANIZER_IDS, NYC_VENUE_IDS
from src.models import Event

logger = logging.getLogger(__name__)

# EB category.short_name → normalized category
_CATEGORY_MAP: dict[str, str] = {
    "Music": "Music",
    "Sports & Fitness": "Sports",
    "Film, Media & Entertainment": "Film",
    "Performing & Visual Arts": "Arts & Theatre",
    "Community & Culture": "Community",
    "Food & Drink": "Community",
    "Charity & Causes": "Community",
    "Science & Technology": "Community",
}


class EventbriteClient:
    """Fetch FIFA-related events from Eventbrite by organization / venue."""

    SOURCE = "eventbrite"

    def __init__(self, private_token: str | None = None) -> None:
        self.token = private_token or EVENTBRITE_PRIVATE_TOKEN
        if not self.token:
            raise ValueError(
                "Eventbrite private token is required. "
                "Set EVENTBRITE_PRIVATE_TOKEN in your .env file."
            )
        self.session = requests.Session()
        self.session.headers["Authorization"] = f"Bearer {self.token}"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def search_events(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        organization_ids: list[str] | None = None,
        status: str = "live",
        keywords: list[str] | None = None,
    ) -> list[Event]:
        """
        Fetch FIFA-related events from configured organizations.

        Iterates over organization IDs, fetches their events, and filters
        results by FIFA keywords in the event name/description and by date range.
        """
        org_ids = organization_ids or NYC_ORGANIZER_IDS
        keywords = keywords or FIFA_KEYWORDS
        keyword_set = {kw.lower() for kw in keywords}

        if not org_ids:
            logger.warning(
                "No Eventbrite organization IDs configured. "
                "Add IDs to src/eventbrite/seed_ids.py or pass organization_ids."
            )
            return []

        seen_ids: set[str] = set()
        events: list[Event] = []

        for org_id in org_ids:
            org_events = self._fetch_org_events(org_id, status)
            for ev in org_events:
                # Dedup
                raw_id = ev.id.removeprefix("eb:")
                if raw_id in seen_ids:
                    continue
                seen_ids.add(raw_id)

                # Keyword filter: check if any FIFA keyword appears in name or description
                searchable = (ev.name or "").lower() + " " + (ev.description or "").lower()
                if not any(kw in searchable for kw in keyword_set):
                    continue

                # Date filter
                if start_date and ev.start_time < start_date:
                    continue
                if end_date and ev.start_time > end_date:
                    continue

                events.append(ev)

        events.sort(key=lambda e: e.start_time)
        logger.info("Eventbrite: found %d FIFA events", len(events))
        return events

    def get_event(self, event_id: str) -> Event:
        """Fetch a single event by its Eventbrite ID."""
        url = f"{EVENTBRITE_BASE_URL}/events/{event_id}/"
        resp = self.session.get(url, params={"expand": "venue,category"})
        resp.raise_for_status()
        return self._parse_event(resp.json())

    def discover_organizations(self) -> list[dict[str, Any]]:
        """
        List organizations tied to the authenticated user.

        Useful for finding your own org ID to add to seed_ids.py.
        """
        url = f"{EVENTBRITE_BASE_URL}/users/me/organizations/"
        resp = self.session.get(url)
        resp.raise_for_status()
        data = resp.json()
        return data.get("organizations", [])

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _fetch_org_events(
        self,
        org_id: str,
        status: str = "live",
    ) -> list[Event]:
        """Paginate through all events for an organization."""
        events: list[Event] = []
        url = f"{EVENTBRITE_BASE_URL}/organizations/{org_id}/events/"
        params: dict[str, Any] = {
            "status": status,
            "expand": "venue,category",
            "order_by": "start_asc",
        }
        has_more = True

        while has_more:
            try:
                resp = self.session.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
            except requests.RequestException as exc:
                logger.warning("EB request failed for org %s: %s", org_id, exc)
                break

            for raw in data.get("events", []):
                try:
                    events.append(self._parse_event(raw))
                except Exception as exc:
                    logger.debug("Failed to parse EB event: %s", exc)

            # Handle pagination via continuation token
            pagination = data.get("pagination", {})
            has_more = pagination.get("has_more_items", False)
            continuation = pagination.get("continuation")
            if has_more and continuation:
                params["continuation"] = continuation
            else:
                has_more = False

        return events

    def _parse_event(self, raw: dict[str, Any]) -> Event:
        """Normalize a raw Eventbrite event dict into a unified Event."""
        event_id = str(raw.get("id", ""))

        # Name & description
        name = raw.get("name", {})
        if isinstance(name, dict):
            name = name.get("text", "")

        description = raw.get("description", {})
        if isinstance(description, dict):
            description = description.get("text", "")
        description = description or None

        # Parse dates
        start_obj = raw.get("start", {})
        start_utc = start_obj.get("utc", "")
        start_time = _parse_eb_datetime(start_utc)

        end_obj = raw.get("end", {})
        end_utc = end_obj.get("utc", "")
        end_time = _parse_eb_datetime(end_utc) if end_utc else None

        # Venue
        venue = raw.get("venue") or {}
        venue_name = venue.get("name")
        address_obj = venue.get("address", {})
        address = address_obj.get("localized_address_display")
        lat = _safe_float(address_obj.get("latitude"))
        lng = _safe_float(address_obj.get("longitude"))

        # Category
        cat = raw.get("category") or {}
        cat_name = cat.get("short_name") or cat.get("name", "")
        category = _CATEGORY_MAP.get(cat_name, cat_name or None)

        # URL & image
        url = raw.get("url")
        logo = raw.get("logo") or {}
        image_url = logo.get("url")

        return Event(
            id=f"eb:{event_id}",
            source=self.SOURCE,
            name=name,
            description=description,
            start_time=start_time,
            end_time=end_time,
            venue_name=venue_name,
            address=address,
            borough=None,  # EB doesn't provide borough
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

def _parse_eb_datetime(dt_str: str) -> datetime:
    """Parse an Eventbrite UTC datetime string."""
    if not dt_str:
        return datetime.min
    # EB format: "2026-06-14T16:00:00Z"
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))


def _safe_float(val: Any) -> float | None:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None
