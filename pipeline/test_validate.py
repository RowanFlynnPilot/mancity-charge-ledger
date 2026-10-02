"""Run with: python -m unittest discover pipeline"""
import copy
import hashlib
import unittest

import validate

SOURCE = {"title": "Decision", "publisher": "Premier League",
          "url": "https://example.com/decision.pdf", "kind": "primary"}
PRESS = {"title": "Report", "publisher": "Paper", "url": "https://example.com/report", "kind": "press"}
URL = "https://example.com/story"
TABLE_2011 = {"title": "Table, 2011/12", "publisher": "Premier League",
              "url": "https://example.com/tables/2011-12", "kind": "primary"}
TABLE_2015 = {"title": "Table, 2015/16", "publisher": "Premier League",
              "url": "https://example.com/tables/2015-16", "kind": "primary"}

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
    "seasons": [
        {"id": "2011-12", "label": "2011/12", "cityPosition": 1, "champion": "Manchester City",
         "runnerUp": "Manchester United", "sources": [TABLE_2011]},
        {"id": "2015-16", "label": "2015/16", "cityPosition": 4, "champion": "Leicester City",
         "runnerUp": "Arsenal", "sources": [TABLE_2015]},
    ],
    "funding": {
        "chargeId": "1A", "locator": "paragraph 72", "sources": [SOURCE],
        "seasons": [
            {"season": "2009/10", "recorded": 27.0, "paidBySponsors": 4.5, "paidByOwner": 22.5},
            {"season": "2010/11", "recorded": 41.25, "paidBySponsors": 12.75, "paidByOwner": 28.5},
        ],
    },
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
        self.data["pending"][0]["id"] = "appeal deadline"
        self.assert_rejected("not a valid URL fragment")

    def test_charge_id_follows_the_numbering_in_the_decision(self):
        self.data["charges"][0]["id"] = "charge-1a"
        self.assert_rejected("id must be the charge number and letter")

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

    def test_season_must_be_consecutive_years(self):
        self.data["seasons"][0] |= {"id": "2011-13", "label": "2011/13"}
        self.assert_rejected("is not a season")

    def test_season_id_must_match_label(self):
        self.data["seasons"][0]["label"] = "2012/13"
        self.assert_rejected("id does not match label")

    def test_funding_must_belong_to_a_charge(self):
        self.data["funding"]["chargeId"] = "9Z"
        self.assert_rejected("chargeId is not a charge")

    def test_funding_parts_must_add_up(self):
        self.data["funding"]["seasons"][0]["paidByOwner"] = 22.4
        self.assert_rejected("do not add up to recorded")

    def test_funding_amounts_must_be_numbers(self):
        self.data["funding"]["seasons"][0]["recorded"] = "27.0"
        self.assert_rejected("bad recorded")

    def test_funding_needs_a_primary_source(self):
        self.data["funding"]["sources"] = [PRESS]
        self.assert_rejected("primary sources only")

    def test_funding_seasons_in_order(self):
        self.data["funding"]["seasons"].reverse()
        self.assert_rejected("seasons not sorted")

    def test_funding_source_must_be_cited_consistently(self):
        self.data["funding"]["sources"] = [SOURCE | {"publisher": "The League"}]
        self.assert_rejected("cited differently elsewhere")

    def test_season_position_must_be_a_league_place(self):
        self.data["seasons"][1]["cityPosition"] = 21
        self.assert_rejected("bad cityPosition")

    def test_season_position_must_agree_with_champion(self):
        self.data["seasons"][0]["cityPosition"] = 3
        self.assert_rejected("disagrees with champion and runnerUp")

    def test_season_runner_up_must_agree_with_position(self):
        self.data["seasons"][1]["runnerUp"] = "Manchester City"
        self.assert_rejected("disagrees with champion and runnerUp")

    def test_season_needs_a_primary_source(self):
        self.data["seasons"][0]["sources"] = [PRESS]
        self.assert_rejected("primary sources only")

    def test_seasons_out_of_order(self):
        self.data["seasons"].reverse()
        self.assert_rejected("seasons: not sorted")

    def test_update_id_must_be_sha1_of_url(self):
        self.data["updates"][0]["id"] = "abc"
        self.assert_rejected("not the sha1")

    def test_update_time_must_be_utc(self):
        self.data["updates"][0]["publishedAt"] = "2026-10-01T22:41:00+01:00"
        self.assert_rejected("publishedAt must be UTC")


if __name__ == "__main__":
    unittest.main()
