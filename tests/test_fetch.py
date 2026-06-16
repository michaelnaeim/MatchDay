"""
Smoke test: fetch FIFA events from each source and print results.

Usage:
    python -m tests.test_fetch
"""

from __future__ import annotations

import json
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("test_fetch")


def _divider(title: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")


def test_nyc_open_data() -> None:
    """NYC Open Data — no API key required."""
    _divider("NYC Open Data (FIFA events)")
    try:
        from src.nyc_open_data.client import NYCOpenDataClient

        client = NYCOpenDataClient()
        events = client.search_events()
        print(f"Found {len(events)} events\n")
        for ev in events[:10]:
            print(f"  {ev}")
        if len(events) > 10:
            print(f"  ... and {len(events) - 10} more")
    except Exception as exc:
        print(f"  ERROR: {exc}")


def test_ticketmaster() -> None:
    """Ticketmaster — requires TICKETMASTER_API_KEY."""
    _divider("Ticketmaster (FIFA events)")
    try:
        from src.ticketmaster.client import TicketmasterClient

        client = TicketmasterClient()
        events = client.search_events()
        print(f"Found {len(events)} events\n")
        for ev in events[:10]:
            print(f"  {ev}")
        if len(events) > 10:
            print(f"  ... and {len(events) - 10} more")
    except ValueError as exc:
        print(f"  SKIPPED (no API key): {exc}")
    except Exception as exc:
        print(f"  ERROR: {exc}")


def test_eventbrite() -> None:
    """Eventbrite — requires EVENTBRITE_PRIVATE_TOKEN + org IDs in seed_ids.py."""
    _divider("Eventbrite (FIFA events)")
    try:
        from src.eventbrite.client import EventbriteClient

        client = EventbriteClient()
        events = client.search_events()
        print(f"Found {len(events)} events\n")
        for ev in events[:10]:
            print(f"  {ev}")
        if len(events) > 10:
            print(f"  ... and {len(events) - 10} more")
    except ValueError as exc:
        print(f"  SKIPPED (no token): {exc}")
    except Exception as exc:
        print(f"  ERROR: {exc}")


def test_aggregator() -> None:
    """Aggregator — merges all available sources."""
    _divider("Aggregator (all sources)")
    try:
        from src.aggregator import fetch_all_events

        events = fetch_all_events()
        print(f"Found {len(events)} total unique events\n")
        for ev in events[:15]:
            print(f"  {ev}")
        if len(events) > 15:
            print(f"  ... and {len(events) - 15} more")

        # Print one full event as JSON for schema verification
        if events:
            _divider("Sample event (full JSON)")
            print(json.dumps(events[0].to_dict(), indent=2, default=str))
    except Exception as exc:
        print(f"  ERROR: {exc}")


if __name__ == "__main__":
    print("🏟️  FIFA NYC Event Data — Smoke Test")
    print(f"{'=' * 60}")

    test_nyc_open_data()
    test_ticketmaster()
    test_eventbrite()
    test_aggregator()

    print(f"\n{'=' * 60}")
    print("  Done!")
    print(f"{'=' * 60}\n")
