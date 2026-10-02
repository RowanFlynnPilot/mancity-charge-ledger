"""Read RSS feeds, keep the items about these cases, write data/updates.json.

Run by the scheduled workflow:
    python pipeline/fetch_updates.py

Any HTTP error or unparseable feed raises. A red workflow run is the alert.
"""
import hashlib
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

UPDATES = Path(__file__).resolve().parent.parent / "data" / "updates.json"

# (publisher, feed url). All three confirmed as valid RSS on 1 Oct 2026.
FEEDS = [
    ("Sky Sports", "https://www.skysports.com/rss/12040"),
    ("BBC Sport", "https://feeds.bbci.co.uk/sport/football/rss.xml"),
    ("The Guardian", "https://www.theguardian.com/football/manchestercity/rss"),
]

USER_AGENT = "charge-ledger/1.0 (+https://github.com/RowanFlynnPilot/mancity-charge-ledger)"
TIMEOUT_SECONDS = 30
KEEP = 200

CLUB = re.compile(r"\bMan(chester)? City\b", re.IGNORECASE)
# Each term matches at the start of a word, so "appeal" also catches "appeals"
# and "appealed". APT is matched separately because it is case-sensitive:
# lower-cased it would hit "apt" and, without the boundary, "captain".
CASE_TERMS = re.compile(
    r"\b(charges|commission|appeal|sanction|verdict|breach|tribunal|points deduction"
    r"|expulsion|financial rules|guilty|ruling|findings|hearing)",
    re.IGNORECASE,
)
APT = re.compile(r"\bAPT\b")

TAG = re.compile(r"<[^>]+>")


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return response.read()


def field(item: ET.Element, tag: str) -> str:
    value = item.findtext(tag)
    if value is None or not value.strip():
        raise ValueError(f"feed item has no <{tag}>")
    return value


def plain_text(value: str) -> str:
    """Feed text with markup, entities and runs of whitespace removed."""
    return " ".join(html.unescape(TAG.sub(" ", value)).split())


def is_about_the_cases(text: str) -> bool:
    return bool(CLUB.search(text)) and bool(CASE_TERMS.search(text) or APT.search(text))


def canonical_url(link: str) -> str:
    """The article URL without tracking parameters, so one article has one id."""
    return urlunsplit(urlsplit(link.strip())._replace(query="", fragment=""))


def published_at(pub_date: str) -> str:
    """RSS pubDate as UTC ISO 8601, so string order is time order."""
    # RFC 822 has no "BST". Sky Sports uses it, and the parser would otherwise
    # return a naive datetime an hour out.
    stamp = parsedate_to_datetime(re.sub(r"\bBST$", "+0100", pub_date.strip()))
    if stamp.tzinfo is None:
        raise ValueError(f"pubDate has no usable time zone: {pub_date!r}")
    return stamp.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_feed(publisher: str, body: bytes) -> list[dict]:
    items = ET.fromstring(body).findall("./channel/item")
    if not items:
        raise ValueError(f"{publisher}: feed has no items")
    updates = []
    for item in items:
        title = plain_text(field(item, "title"))
        # Publishers do send items with an empty description, so it is not required.
        description = plain_text(item.findtext("description") or "")
        if not is_about_the_cases(f"{title} {description}"):
            continue
        url = canonical_url(field(item, "link"))
        updates.append({
            "id": hashlib.sha1(url.encode("utf-8")).hexdigest(),
            "title": title,
            "url": url,
            "publisher": publisher,
            "publishedAt": published_at(field(item, "pubDate")),
        })
    return updates


def merge(existing: list[dict], fetched: list[dict]) -> list[dict]:
    """Fetched items replace stored ones with the same id. Newest first, latest KEEP."""
    by_id = {u["id"]: u for u in existing} | {u["id"]: u for u in fetched}
    newest_first = sorted(by_id.values(), key=lambda u: (u["publishedAt"], u["id"]), reverse=True)
    return newest_first[:KEEP]


def main() -> None:
    existing = json.loads(UPDATES.read_text(encoding="utf-8"))
    fetched = [u for publisher, url in FEEDS for u in read_feed(publisher, fetch(url))]
    merged = merge(existing, fetched)
    UPDATES.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n",
                       encoding="utf-8", newline="\n")
    print(f"updates: {len(fetched)} matched in feeds, {len(merged)} stored")


if __name__ == "__main__":
    main()
