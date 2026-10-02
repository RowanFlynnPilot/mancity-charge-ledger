"""Validate data/*.json and feed/updates.json against the contract in src/types.ts.

Raises on the first violation. Run before every commit and in CI:
    python pipeline/validate.py
"""
import hashlib
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
# The press feed is kept apart from the record, so the history of data/ is the record's own.
FEED = ROOT / "feed"

DATE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$")
ISO_UTC = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
# Ids become URL fragments (#pl-core-decision, #1A).
ID = re.compile(r"^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$")
# Fragments the app uses for its own views. No record may take one.
RESERVED_IDS = {"timeline", "ledger", "seasons", "next", "latest", "method", "funding",
                "allegations"}
SEASON = re.compile(r"^(\d{4})/(\d{2})$")
# A Premier League rule as the charge statement cites it: "B.13", "B.14.6", or a
# range, "E.52 to E.60".
RULE = re.compile(r"^[A-Z]\.\d+(\.\d+)?$")
RULE_RANGE = re.compile(r"^([A-Z])\.(\d+) to \1\.(\d+)$")
# The Commission's own numbering: Charge 2, Charge 1(A).
CHARGE_ID = re.compile(r"^\d+[A-Z]?$")
CLUB = "Manchester City"
CLUBS_IN_LEAGUE = 20
# Press tallies of the charges. The ledger is keyed to the Commission's structure.
PRESS_TALLY = re.compile(r"\b(114|115|130)\s+(charges|breaches)\b", re.IGNORECASE)

EVENT_TYPES = {"report", "investigation", "charge", "hearing", "ruling", "sanction",
               "settlement", "statement", "rule-change", "filing"}
FINDINGS = {"proven", "proven-in-part", "not-proven"}
APPEAL_STATES = {"none", "pending", "upheld", "overturned"}
SOURCE_KINDS = {"primary", "press"}
MAX_UPDATES = 200


def load(name: str, folder: Path = DATA) -> list[dict] | dict:
    return json.loads((folder / f"{name}.json").read_text(encoding="utf-8"))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def check_keys(record: dict, keys: set[str], where: str) -> None:
    require(set(record) == keys, f"{where}: keys {sorted(record)} != {sorted(keys)}")


def check_text(record: dict, fields: tuple[str, ...], where: str) -> None:
    for name in fields:
        value = record[name]
        require(isinstance(value, str) and value != "" and value == value.strip(),
                f"{where}: {name} must be non-empty text with no surrounding whitespace")


def check_date(value: object, where: str) -> None:
    require(isinstance(value, str) and DATE.match(value) is not None, f"{where}: bad date {value!r}")
    try:
        datetime.strptime(value if len(value) == 10 else f"{value}-01", "%Y-%m-%d")
    except ValueError:
        raise ValueError(f"{where}: {value!r} is not a calendar date") from None


def check_season(label: object, where: str) -> None:
    years = SEASON.match(label) if isinstance(label, str) else None
    require(years is not None and int(years[2]) == (int(years[1]) + 1) % 100,
            f"{where}: {label!r} is not a season such as 2009/10")


def check_ids(records: list[dict], where: str) -> None:
    for r in records:
        require(isinstance(r.get("id"), str), f"{where}: record without a text id")
    ids = [r["id"] for r in records]
    require(len(ids) == len(set(ids)), f"{where}: duplicate id")


def check_fragments(*groups: list[dict]) -> None:
    """Every record id is a usable, unambiguous URL fragment across all files."""
    seen = set(RESERVED_IDS)
    for group in groups:
        for record in group:
            fragment = record["id"]
            require(ID.match(fragment) is not None, f"id {fragment!r}: not a valid URL fragment")
            require(fragment not in seen, f"id {fragment!r}: reserved or used by another record")
            seen.add(fragment)


def check_sources(sources: list[dict], where: str, primary_only: bool = False) -> None:
    require(isinstance(sources, list) and len(sources) > 0, f"{where}: no sources")
    for s in sources:
        check_keys(s, {"title", "publisher", "url", "kind"}, where)
        check_text(s, ("title", "publisher", "url"), where)
        require(s["url"].startswith("https://"), f"{where}: source url must be https")
        require(s["kind"] in SOURCE_KINDS, f"{where}: bad source kind {s['kind']!r}")
        require(not primary_only or s["kind"] == "primary", f"{where}: primary sources only")
    urls = [s["url"] for s in sources]
    require(len(urls) == len(set(urls)), f"{where}: the same source is listed twice")


def check_source_consistency(*groups: list[dict]) -> None:
    """One URL is always cited with the same title, publisher and kind."""
    cited: dict[str, dict] = {}
    for group in groups:
        for record in group:
            for s in record["sources"]:
                require(cited.setdefault(s["url"], s) == s,
                        f"{record['id']}: {s['url']} is cited differently elsewhere")


def validate_cases(cases: list[dict]) -> set[str]:
    check_ids(cases, "cases")
    for c in cases:
        where = f"cases/{c['id']}"
        check_keys(c, {"id", "name", "body", "cityRole", "status", "outcome",
                       "cityPositionEventId"}, where)
        check_text(c, ("name", "body", "outcome"), where)
        require(c["cityRole"] in {"respondent", "claimant"}, f"{where}: bad cityRole")
        require(c["status"] in {"open", "closed"}, f"{where}: bad status")
    return {c["id"] for c in cases}


def validate_events(events: list[dict], case_ids: set[str]) -> None:
    check_ids(events, "events")
    for e in events:
        where = f"events/{e['id']}"
        check_keys(e, {"id", "caseIds", "date", "type", "headline", "summary", "sources"}, where)
        check_text(e, ("headline", "summary"), where)
        require(len(e["caseIds"]) > 0 and set(e["caseIds"]) <= case_ids, f"{where}: bad caseIds")
        require(len(e["caseIds"]) == len(set(e["caseIds"])), f"{where}: repeated caseId")
        check_date(e["date"], where)
        require(e["type"] in EVENT_TYPES, f"{where}: bad type {e['type']!r}")
        check_sources(e["sources"], where)
    dates = [e["date"] for e in events]
    require(dates == sorted(dates), "events: not sorted by date ascending")


def validate_charges(charges: list[dict], case_ids: set[str]) -> None:
    check_ids(charges, "charges")
    for c in charges:
        where = f"charges/{c['id']}"
        check_keys(c, {"id", "caseId", "ref", "subject", "period", "finding", "appeal",
                       "summary", "sources"}, where)
        check_text(c, ("ref", "subject", "summary"), where)
        require(CHARGE_ID.match(c["id"]) is not None,
                f"{where}: id must be the charge number and letter, such as 1A or 2")
        require(c["caseId"] in case_ids, f"{where}: bad caseId")
        if c["period"] is not None:
            check_text(c, ("period",), where)
        require(c["finding"] in FINDINGS, f"{where}: bad finding {c['finding']!r}")
        require(c["appeal"] in APPEAL_STATES, f"{where}: bad appeal {c['appeal']!r}")
        require(PRESS_TALLY.search(f"{c['subject']} {c['summary']}") is None,
                f"{where}: press tally of charges in the ledger")
        check_sources(c["sources"], where, primary_only=True)
    refs = [c["ref"] for c in charges]
    require(len(refs) == len(set(refs)), "charges: duplicate ref")


def validate_pending(pending: list[dict], case_ids: set[str]) -> None:
    check_ids(pending, "pending")
    for p in pending:
        where = f"pending/{p['id']}"
        check_keys(p, {"id", "caseId", "label", "due", "detail", "sources"}, where)
        check_text(p, ("label", "detail"), where)
        require(p["caseId"] in case_ids, f"{where}: bad caseId")
        if p["due"] is not None:
            check_date(p["due"], where)
        check_sources(p["sources"], where)


def validate_city_position(cases: list[dict], events: list[dict], charges: list[dict]) -> None:
    """Findings never appear without City's position: the case must point at the
    statement event that records it."""
    events_by_id = {e["id"]: e for e in events}
    cases_with_findings = {c["caseId"] for c in charges}
    for c in cases:
        where = f"cases/{c['id']}"
        position = c["cityPositionEventId"]
        if position is None:
            require(c["id"] not in cases_with_findings,
                    f"{where}: has charges, so cityPositionEventId is required")
            continue
        event = events_by_id.get(position)
        require(event is not None, f"{where}: cityPositionEventId {position!r} is not an event")
        require(c["id"] in event["caseIds"], f"{where}: {position!r} belongs to another case")
        require(event["type"] == "statement", f"{where}: {position!r} is not a statement event")


def validate_seasons(seasons: list[dict]) -> None:
    check_ids(seasons, "seasons")
    for s in seasons:
        where = f"seasons/{s['id']}"
        check_keys(s, {"id", "label", "cityPosition", "champion", "runnerUp", "sources"}, where)
        check_text(s, ("label", "champion", "runnerUp"), where)
        check_season(s["label"], where)
        require(s["id"] == s["label"].replace("/", "-"), f"{where}: id does not match label")
        position = s["cityPosition"]
        require(type(position) is int and 1 <= position <= CLUBS_IN_LEAGUE,
                f"{where}: bad cityPosition {position!r}")
        require(s["champion"] != s["runnerUp"], f"{where}: champion and runnerUp are the same club")
        require((position == 1) == (s["champion"] == CLUB) and (position == 2) == (s["runnerUp"] == CLUB),
                f"{where}: cityPosition disagrees with champion and runnerUp")
        check_sources(s["sources"], where, primary_only=True)
    ids = [s["id"] for s in seasons]
    require(ids == sorted(ids), "seasons: not sorted ascending")


def validate_funding(funding: dict, charges: list[dict]) -> None:
    where = "funding"
    check_keys(funding, {"chargeId", "locator", "sources", "seasons"}, where)
    check_text(funding, ("locator",), where)
    require(funding["chargeId"] in {c["id"] for c in charges}, f"{where}: chargeId is not a charge")
    check_sources(funding["sources"], where, primary_only=True)
    require(len(funding["seasons"]) > 0, f"{where}: no seasons")
    amounts = ("recorded", "paidBySponsors", "paidByOwner")
    for s in funding["seasons"]:
        check_keys(s, {"season", *amounts}, where)
        check_season(s["season"], where)
        season = f"{where}/{s['season']}"
        for name in amounts:
            require(type(s[name]) in (int, float) and s[name] >= 0, f"{season}: bad {name}")
        require(round(s["paidBySponsors"] + s["paidByOwner"] - s["recorded"], 2) == 0,
                f"{season}: the two parts do not add up to recorded")
    labels = [s["season"] for s in funding["seasons"]]
    require(labels == sorted(set(labels)), f"{where}: seasons not sorted ascending, or repeated")


def check_rule(rule: object, where: str) -> None:
    require(isinstance(rule, str), f"{where}: a rule must be text")
    span = RULE_RANGE.match(rule)
    require(RULE.match(rule) is not None or (span is not None and int(span[3]) > int(span[2])),
            f"{where}: {rule!r} is not a rule number or a range of them")


def validate_allegations(allegations: dict, charges: list[dict]) -> None:
    where = "allegations"
    check_keys(allegations, {"sources", "pressTally", "groups"}, where)
    check_sources(allegations["sources"], where, primary_only=True)

    tally = allegations["pressTally"]
    check_keys(tally, {"count", "sources"}, f"{where}/pressTally")
    require(type(tally["count"]) is int and tally["count"] > 0, f"{where}/pressTally: bad count")
    check_sources(tally["sources"], f"{where}/pressTally")

    charge_ids = {c["id"] for c in charges}
    check_ids(allegations["groups"], where)
    for g in allegations["groups"]:
        group = f"{where}/{g['id']}"
        check_keys(g, {"id", "subject", "chargeIds", "seasons"}, group)
        check_text(g, ("subject",), group)
        require(ID.match(g["id"]) is not None, f"{group}: bad id")
        require(len(g["chargeIds"]) > 0 and set(g["chargeIds"]) <= charge_ids
                and len(g["chargeIds"]) == len(set(g["chargeIds"])), f"{group}: bad chargeIds")
        require(len(g["seasons"]) > 0, f"{group}: no seasons")
        for s in g["seasons"]:
            check_keys(s, {"season", "rules", "note"}, group)
            check_season(s["season"], group)
            season = f"{group}/{s['season']}"
            require(isinstance(s["rules"], list) and len(s["rules"]) > 0, f"{season}: no rules")
            for rule in s["rules"]:
                check_rule(rule, season)
            require(len(s["rules"]) == len(set(s["rules"])), f"{season}: a rule is listed twice")
            if s["note"] is not None:
                check_text(s, ("note",), season)
        labels = [s["season"] for s in g["seasons"]]
        require(labels == sorted(set(labels)), f"{group}: seasons not sorted ascending, or repeated")


def validate_updates(updates: list[dict]) -> None:
    check_ids(updates, "updates")
    require(len(updates) <= MAX_UPDATES, f"updates: more than {MAX_UPDATES} items")
    for u in updates:
        where = f"updates/{u['id']}"
        check_keys(u, {"id", "title", "url", "publisher", "publishedAt"}, where)
        check_text(u, ("title", "url", "publisher", "publishedAt"), where)
        require(u["url"].startswith("https://"), f"{where}: url must be https")
        require(u["id"] == hashlib.sha1(u["url"].encode("utf-8")).hexdigest(),
                f"{where}: id is not the sha1 of the url")
        require(ISO_UTC.match(u["publishedAt"]) is not None,
                f"{where}: publishedAt must be UTC, YYYY-MM-DDTHH:MM:SSZ")
    stamps = [u["publishedAt"] for u in updates]
    require(stamps == sorted(stamps, reverse=True), "updates: not sorted newest first")


def validate(cases: list[dict], events: list[dict], charges: list[dict], pending: list[dict],
             seasons: list[dict], funding: dict, allegations: dict, updates: list[dict]) -> None:
    case_ids = validate_cases(cases)
    validate_events(events, case_ids)
    validate_charges(charges, case_ids)
    validate_pending(pending, case_ids)
    validate_city_position(cases, events, charges)
    validate_seasons(seasons)
    validate_funding(funding, charges)
    validate_allegations(allegations, charges)
    check_fragments(cases, events, charges, pending, seasons)
    check_source_consistency(events, charges, pending, seasons, [
        funding | {"id": "funding"},
        allegations | {"id": "allegations"},
        allegations["pressTally"] | {"id": "allegations/pressTally"},
    ])
    validate_updates(updates)


def main() -> None:
    validate(load("cases"), load("events"), load("charges"), load("pending"),
             load("seasons"), load("funding"), load("allegations"), load("updates", FEED))
    print("data ok")


if __name__ == "__main__":
    main()
