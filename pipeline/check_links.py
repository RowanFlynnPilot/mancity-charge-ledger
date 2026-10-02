"""Check that every source the record cites still answers.

Run weekly by a workflow, and by hand:
    python pipeline/check_links.py

Prints one line for each address, then raises if any of them is dead. A red
workflow run is the alert. It checks them all first, so one run names every
dead link.
"""
import urllib.error
import urllib.request
from urllib.parse import urlsplit

from fetch_updates import TIMEOUT_SECONDS, USER_AGENT
from validate import load

# Sites that refuse requests from a script, so their links cannot be checked
# here. They are printed as "not checked" for a person to open. Add a host only
# after seeing it refuse this script while the page opens in a browser.
UNCHECKED_HOSTS = {
    "www.mancity.com",  # answers 403
    "www.uefa.com",  # resets the connection or never answers
    "www.farrer.co.uk",  # answers 403
}

PDF_SIGNATURE = b"%PDF"


def cited(records: list[dict]) -> list[str]:
    """Every source address in these records, once each, in the order first cited."""
    return list(dict.fromkeys(s["url"] for record in records for s in record["sources"]))


def fault(url: str, status: int, start: bytes) -> str | None:
    """What is wrong with this answer, or None if the link is alive."""
    if not 200 <= status < 300:
        return f"answered {status}"
    # tas-cas.org answers 200 with a web page for a file that has gone.
    if urlsplit(url).path.lower().endswith(".pdf") and start != PDF_SIGNATURE:
        return "answered with a page, not the PDF"
    return None


def check(url: str) -> str | None:
    """Request the address and say what is wrong with it, or None."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return fault(url, response.status, response.read(len(PDF_SIGNATURE)))
    except urllib.error.HTTPError as error:
        return fault(url, error.code, b"")
    except OSError as error:  # no such host, refused, timed out
        return f"no answer: {error}"


def main() -> None:
    allegations = load("allegations")
    urls = cited([*load("events"), *load("charges"), *load("pending"), *load("seasons"),
                  load("funding"), allegations, allegations["pressTally"]])
    dead = []
    for url in urls:
        if urlsplit(url).hostname in UNCHECKED_HOSTS:
            print(f"not checked  {url}")
            continue
        problem = check(url)
        if problem is None:
            print(f"ok           {url}")
        else:
            print(f"DEAD         {url}  ({problem})")
            dead.append(url)
    unchecked = sum(urlsplit(url).hostname in UNCHECKED_HOSTS for url in urls)
    print(f"links: {len(urls)} cited, {len(urls) - unchecked - len(dead)} ok, "
          f"{unchecked} not checked, {len(dead)} dead")
    if dead:
        raise ValueError(f"{len(dead)} cited sources are dead: {', '.join(dead)}")


if __name__ == "__main__":
    main()
