"""Run with: python -m unittest discover pipeline"""
import unittest

import check_links

PAGE = "https://example.com/news/statement"
PDF = "https://example.com/files/Award.PDF"


def record(*urls: str) -> dict:
    return {"sources": [{"url": url} for url in urls]}


class Cited(unittest.TestCase):
    def test_each_address_once_in_the_order_first_cited(self):
        records = [record(PAGE, PDF), record(PDF), record("https://example.com/other", PAGE)]
        self.assertEqual(check_links.cited(records), [PAGE, PDF, "https://example.com/other"])


class Fault(unittest.TestCase):
    def test_a_page_that_answers_is_alive(self):
        self.assertIsNone(check_links.fault(PAGE, 200, b"<!do"))

    def test_any_success_status_is_alive(self):
        self.assertIsNone(check_links.fault(PAGE, 202, b""))

    def test_not_found_is_dead(self):
        self.assertEqual(check_links.fault(PAGE, 404, b""), "answered 404")

    def test_refused_is_dead(self):
        self.assertEqual(check_links.fault(PAGE, 403, b""), "answered 403")

    def test_a_pdf_that_answers_with_a_pdf_is_alive(self):
        self.assertIsNone(check_links.fault(PDF, 200, b"%PDF"))

    def test_a_pdf_that_answers_with_a_page_is_dead(self):
        self.assertEqual(check_links.fault(PDF, 200, b"\r\n<!"), "answered with a page, not the PDF")

    def test_a_query_string_does_not_hide_a_pdf(self):
        self.assertIsNotNone(check_links.fault(PDF + "?download=1", 200, b"<htm"))


class UncheckedHosts(unittest.TestCase):
    def test_hosts_are_written_as_urls_give_them(self):
        for host in check_links.UNCHECKED_HOSTS:
            self.assertEqual(host, host.lower())
            self.assertNotIn("/", host)


if __name__ == "__main__":
    unittest.main()
