"""
Curated Eventbrite organizer and venue IDs for FIFA / World Cup events in NYC.

HOW TO FIND IDs:
  1. Go to an organizer's Eventbrite page (e.g., https://www.eventbrite.com/o/org-name-12345)
     → the number at the end is the organizer ID.
  2. Or use EventbriteClient.discover_organizations() to list orgs tied to your account.
  3. For venues, inspect network requests on an event page to find venue_id.

Add IDs below as you discover FIFA / soccer related organizers and venues in NYC.
"""

# FIFA / World Cup / Soccer organizer IDs in the NYC area
NYC_ORGANIZER_IDS: list[str] = [
    # Add organizer IDs you want to track here, e.g.:
    # "12345678901",  # FIFA Fan Fest NYC
    # "98765432101",  # NYC Soccer Supporters Club
]

# NYC venue IDs known for watch parties / soccer events
NYC_VENUE_IDS: list[str] = [
    # Add venue IDs here, e.g.:
    # "55555555501",  # Smithfield Hall (soccer bar)
    # "66666666601",  # Football Factory at Legends
]
