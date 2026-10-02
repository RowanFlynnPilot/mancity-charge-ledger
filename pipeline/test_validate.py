"""Run with: python -m unittest discover pipeline"""
import copy
import hashlib
import unittest

import validate

SOURCE = {"title": "Decision", "publisher": "Premier League",
          "url": "https://example.com/decision.pdf", "kind": "primary"}
PRESS = {"title": "Report", "publisher": "Paper", "url": "https://example.com/report", "kind": "press"}
URL = "https://example.com/story"

VALID = {
    "cases": [{"id": "pl-2023", "name": "Premier League v Manchester City", "body": "Commission",
               "cityRole": "respondent", "status": "open", "outcome": "Open.",
               "cityPositionEventId": "city-response"}],
    "events": [
        {"id": "decision", "caseIds": ["pl-2023"], "date": "2026-09-29", "type": "ruling",
         "headline": "Decision", "summary": "Published.", "sources": [SOURCE]},
        {"id": "city-response", "caseIds": ["pl-2023"], "date": "2026-09-29", "type": "statement",
         "headline": "City responds", "summary": "City denies it.", "sources": [PRESS]},
    ],
    "charges": [{"id": "1A", "caseId": "pl-2023", "ref": "Charge 1(A)", "subject": "Sponsorship",
                 "period": None, "finding": "proven", "appeal": "none", "summary": "Found proven.",
                 "sources": [SOURCE]}],
    "pending": [{"id": "appeal-deadline", "caseId": "pl-2023", "label": "Deadline", "due": "2026-10",
                 "detail": "Due.", "sources": [SOURCE]}],
    "updates": [{"id": hashlib.sha1(URL.encode()).hexdigest(), "title": "Story", "url": URL,
                 "publisher": "Paper", "publishedAt": "2026-10-01T21:41:00Z"}],
}


class Validate(unittest.TestCase):
    def setUp(self):
        self.data = copy.deepcopy(VALID)

    def assert_rejected(self, fragment: str):
        with self.assertRaises(ValueError) as raised:
            validate.validate(**self.data)
        self.assertIn(fragment, str(raised.exception))

    def test_valid_data_passes(self):
        validate.validate(**self.data)

    def test_impossible_date(self):
        self.data["events"][0]["date"] = "2026-02-30"
        self.assert_rejected("not a calendar date")

    def test_events_out_of_order(self):
        self.data["events"][1]["date"] = "2026-09-28"
        self.assert_rejected("not sorted")

    def test_empty_summary(self):
        self.data["events"][0]["summary"] = ""
        self.assert_rejected("summary must be non-empty")

    def test_press_source_on_a_charge(self):
        self.data["charges"][0]["sources"] = [PRESS]
        self.assert_rejected("primary sources only")

    def test_press_tally_in_the_ledger(self):
        self.data["charges"][0]["summary"] = "One of the 115 charges."
        self.assert_rejected("press tally")

    def test_id_shared_across_files(self):
        self.data["pending"][0]["id"] = "decision"
        self.assert_rejected("reserved or used by another record")

    def test_id_reserved_for_a_view(self):
        self.data["pending"][0]["id"] = "ledger"
        self.assert_rejected("reserved or used by another record")

    def test_id_not_a_url_fragment(self):
        self.data["charges"][0]["id"] = "1 A"
        self.assert_rejected("not a valid URL fragment")

    def test_source_cited_inconsistently(self):
        self.data["pending"][0]["sources"] = [SOURCE | {"title": "The Decision"}]
        self.assert_rejected("cited differently elsewhere")

    def test_case_with_charges_needs_city_position(self):
        self.data["cases"][0]["cityPositionEventId"] = None
        self.assert_rejected("cityPositionEventId is required")

    def test_city_position_must_be_a_statement(self):
        self.data["cases"][0]["cityPositionEventId"] = "decision"
        self.assert_rejected("not a statement event")

    def test_city_position_must_exist(self):
        self.data["cases"][0]["cityPositionEventId"] = "missing"
        self.assert_rejected("is not an event")

    def test_update_id_must_be_sha1_of_url(self):
        self.data["updates"][0]["id"] = "abc"
        self.assert_rejected("not the sha1")

    def test_update_time_must_be_utc(self):
        self.data["updates"][0]["publishedAt"] = "2026-10-01T22:41:00+01:00"
        self.assert_rejected("publishedAt must be UTC")


if __name__ == "__main__":
    unittest.main()
