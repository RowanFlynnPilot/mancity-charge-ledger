"""Build data/seasons.json from the Premier League's own final tables.

Reads the League's standings for each season the accounts charges cover and records
where City finished, the champion and the runner-up. Each row cites that
season's table page on premierleague.com.

Final tables do not change week to week, so this is run by hand, not by a
workflow:
    python pipeline/build_seasons.py

Any HTTP error, or a table that is not a complete final table, raises.
"""
import json
from pathlib import Path

from fetch_updates import fetch

SEASONS = Path(__file__).resolve().parent.parent / "data" / "seasons.json"

# The League's standings feed, by the year the season starts. It is the data
# behind the table page that each row cites.
STANDINGS = ("https://sdp-prem-prod.premier-league-prod.pulselive.com"
             "/api/v5/competitions/8/seasons/{year}/standings?live=false")
TABLE_PAGE = "https://www.premierleague.com/en/tables/premier-league/{id}/all-matchweeks"

# 2009/10 to 2017/18, the seasons covered by the charges about the club's accounts and spending.
FIRST_YEAR, LAST_YEAR = 2009, 2017
CLUB = "Manchester City"
CLUBS = 20
MATCHES = 38


def season_id(year: int) -> str:
    return f"{year}-{(year + 1) % 100:02d}"


def final_table(year: int, standings: dict) -> list[str]:
    """Club names in finishing order. Raises unless this is the complete final table."""
    if standings["season"]["id"] != str(year):
        raise ValueError(f"{year}: feed returned season {standings['season']['id']!r}")
    if standings["live"] or len(standings["tables"]) != 1:
        raise ValueError(f"{year}: not a single settled table")
    entries = standings["tables"][0]["entries"]
    if len(entries) != CLUBS or any(e["overall"]["played"] != MATCHES for e in entries):
        raise ValueError(f"{year}: not a final table of {CLUBS} clubs with {MATCHES} matches each")
    ordered = sorted(entries, key=lambda e: e["overall"]["position"])
    if [e["overall"]["position"] for e in ordered] != list(range(1, CLUBS + 1)):
        raise ValueError(f"{year}: positions are not 1 to {CLUBS}")
    return [e["team"]["name"] for e in ordered]


def season(year: int, table: list[str]) -> dict:
    label = season_id(year).replace("-", "/")
    return {
        "id": season_id(year),
        "label": label,
        "cityPosition": table.index(CLUB) + 1,
        "champion": table[0],
        "runnerUp": table[1],
        "sources": [{
            "title": f"Final table, {label}",
            "publisher": "Premier League",
            "url": TABLE_PAGE.format(id=season_id(year)),
            "kind": "primary",
        }],
    }


def main() -> None:
    seasons = []
    for year in range(FIRST_YEAR, LAST_YEAR + 1):
        standings = json.loads(fetch(STANDINGS.format(year=year)))
        seasons.append(season(year, final_table(year, standings)))
    SEASONS.write_text(json.dumps(seasons, indent=2, ensure_ascii=False) + "\n",
                       encoding="utf-8", newline="\n")
    print(f"seasons: {len(seasons)} written")


if __name__ == "__main__":
    main()
