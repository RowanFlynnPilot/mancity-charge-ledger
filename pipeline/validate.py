"""Validate data/*.json against the contract in src/types.ts.

Raises on the first violation. Run before every commit and in CI:
    python pipeline/validate.py
"""
import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

DATE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$")
EVENT_TYPES = {"report", "investigation", "charge", "hearing", "ruling", "sanction",
               "settlement", "statement", "rule-change", "filing"}
FINDINGS = {"proven", "proven-in-part", "not-proven"}
APPEAL_STATES = {"none", "pending", "upheld", "overturned"}
SOURCE_KINDS = {"primary", "press"}


def load(name: str) -> list[dict]:
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def check_keys(record: dict, keys: set[str], where: str) -> None:
    require(set(record) == keys, f"{where}: keys {sorted(record)} != {sorted(keys)}")


def check_unique_ids(records: list[dict], where: str) -> None:
    ids = [r["id"] for r in records]
    require(len(ids) == len(set(ids)), f"{where}: duplicate id")


def check_sources(sources: list[dict], where: str, primary_only: bool = False) -> None:
    require(len(sources) > 0, f"{where}: no sources")
    for s in sources:
        check_keys(s, {"title", "publisher", "url", "kind"}, where)
        require(s["url"].startswith("https://"), f"{where}: source url must be https")
        require(s["kind"] in SOURCE_KINDS, f"{where}: bad source kind {s['kind']!r}")
        require(not primary_only or s["kind"] == "primary", f"{where}: primary sources only")


def validate_cases(cases: list[dict]) -> set[str]:
    check_unique_ids(cases, "cases")
    for c in cases:
        where = f"cases/{c['id']}"
        check_keys(c, {"id", "name", "body", "cityRole", "status", "outcome"}, where)
        require(c["cityRole"] in {"respondent", "claimant"}, f"{where}: bad cityRole")
        require(c["status"] in {"open", "closed"}, f"{where}: bad status")
    return {c["id"] for c in cases}


def validate_events(events: list[dict], case_ids: set[str]) -> None:
    check_unique_ids(events, "events")
    for e in events:
        where = f"events/{e['id']}"
        check_keys(e, {"id", "caseIds", "date", "type", "headline", "summary", "sources"}, where)
        require(len(e["caseIds"]) > 0 and set(e["caseIds"]) <= case_ids, f"{where}: bad caseIds")
        require(DATE.match(e["date"]) is not None, f"{where}: bad date {e['date']!r}")
        require(e["type"] in EVENT_TYPES, f"{where}: bad type {e['type']!r}")
        check_sources(e["sources"], where)
    dates = [e["date"] for e in events]
    require(dates == sorted(dates), "events: not sorted by date ascending")


def validate_charges(charges: list[dict], case_ids: set[str]) -> None:
    check_unique_ids(charges, "charges")
    for c in charges:
        where = f"charges/{c['id']}"
        check_keys(c, {"id", "caseId", "ref", "subject", "period", "finding", "appeal",
                       "summary", "sources"}, where)
        require(c["caseId"] in case_ids, f"{where}: bad caseId")
        require(c["period"] is None or isinstance(c["period"], str), f"{where}: bad period")
        require(c["finding"] in FINDINGS, f"{where}: bad finding {c['finding']!r}")
        require(c["appeal"] in APPEAL_STATES, f"{where}: bad appeal {c['appeal']!r}")
        check_sources(c["sources"], where, primary_only=True)


def validate_pending(pending: list[dict], case_ids: set[str]) -> None:
    check_unique_ids(pending, "pending")
    for p in pending:
        where = f"pending/{p['id']}"
        check_keys(p, {"id", "caseId", "label", "due", "detail", "sources"}, where)
        require(p["caseId"] in case_ids, f"{where}: bad caseId")
        require(p["due"] is None or DATE.match(p["due"]) is not None, f"{where}: bad due")
        check_sources(p["sources"], where)


def validate_updates(updates: list[dict]) -> None:
    check_unique_ids(updates, "updates")
    for u in updates:
        where = f"updates/{u['id']}"
        check_keys(u, {"id", "title", "url", "publisher", "publishedAt"}, where)
        require(u["url"].startswith("https://"), f"{where}: url must be https")
    stamps = [u["publishedAt"] for u in updates]
    require(stamps == sorted(stamps, reverse=True), "updates: not sorted newest first")


def main() -> None:
    case_ids = validate_cases(load("cases"))
    validate_events(load("events"), case_ids)
    validate_charges(load("charges"), case_ids)
    validate_pending(load("pending"), case_ids)
    validate_updates(load("updates"))
    print("data ok")


if __name__ == "__main__":
    main()
