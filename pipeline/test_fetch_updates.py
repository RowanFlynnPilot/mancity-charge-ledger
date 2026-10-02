"""Run with: python -m unittest discover pipeline"""
import hashlib
import unittest
import xml.etree.ElementTree as ET

import fetch_updates


def feed(*items: str) -> bytes:
    return f"<rss><channel><title>Test</title>{''.join(items)}</channel></rss>".encode("utf-8")


def item(title: str, description: str = "Report.", link: str = "https://example.com/a",
         pub_date: str = "Thu, 01 Oct 2026 22:41:00 GMT") -> str:
    return (f"<item><title>{title}</title><description>{description}</description>"
            f"<link>{link}</link><pubDate>{pub_date}</pubDate></item>")


class Matching(unittest.TestCase):
    def test_keeps_club_with_case_term(self):
        self.assertTrue(fetch_updates.is_about_the_cases("Man City appeal strategy revealed"))
        self.assertTrue(fetch_updates.is_about_the_cases("Manchester City face points deduction"))

    def test_term_matches_at_word_start(self):
        self.assertTrue(fetch_updates.is_about_the_cases("Man City breaches detailed"))
        self.assertTrue(fetch_updates.is_about_the_cases("Man City appealed on Friday"))

    def test_drops_club_without_case_term(self):
        self.assertFalse(fetch_updates.is_about_the_cases("Man City hold on to claim draw"))

    def test_drops_case_term_without_club(self):
        self.assertFalse(fetch_updates.is_about_the_cases("Wade's brutal verdict on the format"))

    def test_apt_is_case_sensitive_and_whole_word(self):
        self.assertTrue(fetch_updates.is_about_the_cases("Man City and the APT rules"))
        self.assertFalse(fetch_updates.is_about_the_cases("Man City captain adapts, an apt choice"))


class Dates(unittest.TestCase):
    def test_gmt(self):
        self.assertEqual(fetch_updates.published_at("Thu, 01 Oct 2026 22:56:09 GMT"),
                         "2026-10-01T22:56:09Z")

    def test_bst_is_one_hour_ahead_of_utc(self):
        self.assertEqual(fetch_updates.published_at("Thu, 01 Oct 2026 22:41:00 BST"),
                         "2026-10-01T21:41:00Z")

    def test_numeric_offset(self):
        self.assertEqual(fetch_updates.published_at("Thu, 01 Oct 2026 00:30:00 +0100"),
                         "2026-09-30T23:30:00Z")

    def test_unknown_zone_raises(self):
        with self.assertRaises(ValueError):
            fetch_updates.published_at("Thu, 01 Oct 2026 22:41:00 CEST")


class ReadFeed(unittest.TestCase):
    def test_builds_update_from_matching_item(self):
        body = feed(item("Man City&amp;#x2019;s  appeal",
                         link="https://www.bbc.co.uk/sport/x?at_medium=RSS&amp;at_campaign=rss"))
        self.assertEqual(fetch_updates.read_feed("BBC Sport", body), [{
            "id": hashlib.sha1(b"https://www.bbc.co.uk/sport/x").hexdigest(),
            "title": "Man City’s appeal",
            "url": "https://www.bbc.co.uk/sport/x",
            "publisher": "BBC Sport",
            "publishedAt": "2026-10-01T22:41:00Z",
        }])

    def test_matches_on_description_with_markup_removed(self):
        body = feed(item("Club statement", "&lt;p&gt;Manchester City &lt;b&gt;verdict&lt;/b&gt;&lt;/p&gt;"))
        self.assertEqual(len(fetch_updates.read_feed("Sky Sports", body)), 1)

    def test_markup_alone_does_not_match(self):
        body = feed(item("Man City win", '&lt;a href="/appeal"&gt;More&lt;/a&gt;'))
        self.assertEqual(fetch_updates.read_feed("Sky Sports", body), [])

    def test_empty_description_is_allowed(self):
        body = feed("<item><title>Man City appeal</title><description></description>"
                    "<link>https://example.com/a</link>"
                    "<pubDate>Thu, 01 Oct 2026 22:41:00 GMT</pubDate></item>")
        self.assertEqual(len(fetch_updates.read_feed("Sky Sports", body)), 1)

    def test_unparseable_feed_raises(self):
        with self.assertRaises(ET.ParseError):
            fetch_updates.read_feed("Sky Sports", b"<html>Service unavailable")

    def test_feed_without_items_raises(self):
        with self.assertRaises(ValueError):
            fetch_updates.read_feed("Sky Sports", feed())

    def test_item_without_date_raises(self):
        body = feed("<item><title>Man City appeal</title><description>x</description>"
                    "<link>https://example.com/a</link></item>")
        with self.assertRaises(ValueError):
            fetch_updates.read_feed("Sky Sports", body)


class Merge(unittest.TestCase):
    @staticmethod
    def update(n: int, title: str = "t") -> dict:
        return {"id": f"{n:040d}", "title": title, "url": f"https://example.com/{n}",
                "publisher": "p", "publishedAt": f"2026-10-01T00:{n // 60:02d}:{n % 60:02d}Z"}

    def test_fetched_replaces_stored_and_sorts_newest_first(self):
        stored = [self.update(2, "old title"), self.update(1)]
        merged = fetch_updates.merge(stored, [self.update(3), self.update(2, "new title")])
        self.assertEqual([u["id"] for u in merged], [f"{n:040d}" for n in (3, 2, 1)])
        self.assertEqual(merged[1]["title"], "new title")

    def test_keeps_only_the_latest(self):
        merged = fetch_updates.merge([], [self.update(n) for n in range(fetch_updates.KEEP + 5)])
        self.assertEqual(len(merged), fetch_updates.KEEP)
        self.assertEqual(merged[-1]["id"], f"{5:040d}")


if __name__ == "__main__":
    unittest.main()
