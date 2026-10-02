"""Run with: python -m unittest discover pipeline"""
import copy
import unittest

import build_seasons

OTHERS = [f"Club {n}" for n in range(1, 18)]


def standings(order: list[str], year: int = 2011) -> dict:
    return {
        "season": {"id": str(year)},
        "live": False,
        # Deliberately not in finishing order: the feed's order is not relied on.
        "tables": [{"entries": [
            {"team": {"name": name}, "overall": {"position": position, "played": 38}}
            for position, name in reversed(list(enumerate(order, 1)))
        ]}],
    }


class FinalTable(unittest.TestCase):
    def setUp(self):
        self.order = ["Manchester City", "Manchester United", "Arsenal", *OTHERS]
        self.standings = standings(self.order)

    def test_returns_clubs_in_finishing_order(self):
        self.assertEqual(build_seasons.final_table(2011, self.standings), self.order)

    def test_rejects_another_season(self):
        with self.assertRaises(ValueError):
            build_seasons.final_table(2012, self.standings)

    def test_rejects_a_live_table(self):
        self.standings["live"] = True
        with self.assertRaises(ValueError):
            build_seasons.final_table(2011, self.standings)

    def test_rejects_an_unfinished_season(self):
        self.standings["tables"][0]["entries"][0]["overall"]["played"] = 37
        with self.assertRaises(ValueError):
            build_seasons.final_table(2011, self.standings)

    def test_rejects_a_short_table(self):
        self.standings["tables"][0]["entries"].pop()
        with self.assertRaises(ValueError):
            build_seasons.final_table(2011, self.standings)

    def test_rejects_shared_positions(self):
        broken = copy.deepcopy(self.standings)
        broken["tables"][0]["entries"][0]["overall"]["position"] = 1
        with self.assertRaises(ValueError):
            build_seasons.final_table(2011, broken)


class Season(unittest.TestCase):
    def test_builds_a_sourced_row(self):
        table = ["Chelsea", "Manchester United", "Arsenal", "Tottenham Hotspur", "Manchester City", *OTHERS[:15]]
        self.assertEqual(build_seasons.season(2009, table), {
            "id": "2009-10",
            "label": "2009/10",
            "cityPosition": 5,
            "champion": "Chelsea",
            "runnerUp": "Manchester United",
            "sources": [{
                "title": "Final table, 2009/10",
                "publisher": "Premier League",
                "url": "https://www.premierleague.com/en/tables/premier-league/2009-10/all-matchweeks",
                "kind": "primary",
            }],
        })

    def test_season_id_across_the_century(self):
        self.assertEqual(build_seasons.season_id(1999), "1999-00")
        self.assertEqual(build_seasons.season_id(2017), "2017-18")

    def test_city_missing_from_the_table_raises(self):
        with self.assertRaises(ValueError):
            build_seasons.season(2009, ["Chelsea", "Arsenal", *OTHERS])


if __name__ == "__main__":
    unittest.main()
