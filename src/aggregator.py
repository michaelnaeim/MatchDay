"""
Event aggregator — merges FIFA event data from all configured sources.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Literal

from src.models import Event

logger = logging.getLogger(__name__)

SourceName = Literal["ticketmaster", "nyc_open_data", "eventbrite"]

ALL_SOURCES: list[SourceName] = ["ticketmaster", "nyc_open_data", "eventbrite"]


def fetch_all_events(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    sources: list[SourceName] | None = None,
) -> list[Event]:
    """
    Fetch FIFA events from all (or selected) sources, merge, and sort.

    Args:
        start_date: Filter events starting on or after this date.
        end_date: Filter events starting on or before this date.
        sources: Which sources to query. Defaults to all three.

    Returns:
        A de-duplicated, chronologically sorted list of Events.
    """
    sources = sources or ALL_SOURCES
    all_events: list[Event] = []
    errors: dict[str, str] = {}

    # ------- Ticketmaster -------
    if "ticketmaster" in sources:
        try:
            from src.ticketmaster.client import TicketmasterClient

            tm = TicketmasterClient()
            events = tm.search_events(start_date=start_date, end_date=end_date)
            all_events.extend(events)
            logger.info("Ticketmaster: %d events", len(events))
        except Exception as exc:
            errors["ticketmaster"] = str(exc)
            logger.error("Ticketmaster fetch failed: %s", exc)

    # ------- NYC Open Data -------
    if "nyc_open_data" in sources:
        try:
            from src.nyc_open_data.client import NYCOpenDataClient

            nyc = NYCOpenDataClient()
            events = nyc.search_events(start_date=start_date, end_date=end_date)
            all_events.extend(events)
            logger.info("NYC Open Data: %d events", len(events))
        except Exception as exc:
            errors["nyc_open_data"] = str(exc)
            logger.error("NYC Open Data fetch failed: %s", exc)

    # ------- Eventbrite -------
    if "eventbrite" in sources:
        try:
            from src.eventbrite.client import EventbriteClient

            eb = EventbriteClient()
            events = eb.search_events(start_date=start_date, end_date=end_date)
            all_events.extend(events)
            logger.info("Eventbrite: %d events", len(events))
        except Exception as exc:
            errors["eventbrite"] = str(exc)
            logger.error("Eventbrite fetch failed: %s", exc)

    # ------- De-duplicate & sort -------
    seen: set[str] = set()
    unique: list[Event] = []
    for ev in all_events:
        if ev.id not in seen:
            seen.add(ev.id)
            unique.append(ev)

    unique.sort(key=lambda e: e.start_time)

    logger.info(
        "Aggregator: %d total unique events from %d sources (%s)",
        len(unique),
        len(sources),
        ", ".join(sources),
    )
    if errors:
        logger.warning("Errors from sources: %s", errors)

    return unique
