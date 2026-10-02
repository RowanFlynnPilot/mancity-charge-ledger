import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Latest } from "./components/Latest";
import { Ledger } from "./components/Ledger";
import { Mark } from "./components/Mark";
import { Method } from "./components/Method";
import { Opening } from "./components/Opening";
import { Seasons } from "./components/Seasons";
import { Timeline } from "./components/Timeline";
import { WhatsNext } from "./components/WhatsNext";
import { moved, viewOfRecord } from "./data";
import { HOME, NOT_FOUND, resolve, VIEWS, type Route } from "./route";
import { EDIT_HISTORY, LICENCE, REPO, SITE } from "./site";

// The page for one route. It reads nothing from the browser while it renders,
// so the build can render it to markup and a test can render every address.
export function Page({ route }: { route: Route }) {
  const view = VIEWS.find((v) => v.id === route.view)!;

  useEffect(() => {
    document.title = `${view.label} | ${SITE}`;
  }, [view]);

  // On a narrow screen the view links scroll sideways. Keep the current one in sight.
  const links = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = links.current!;
    const current = list.querySelector<HTMLElement>('[aria-current="page"]')!;
    list.scrollLeft = current.offsetLeft - list.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
  }, [view]);

  // The linked entry is rendered by now, so the browser's own jump to it has
  // already missed. Do it here.
  useEffect(() => {
    if (route.target === null) return;
    // An id that has moved resolves to the record it became. Put that id in the
    // address, so the address a reader copies from here is the current one.
    if (route.target !== NOT_FOUND && window.location.hash !== `#${route.target}`) {
      window.history.replaceState(null, "", `#${route.target}`);
    }
    const element = document.getElementById(route.target);
    if (element === null) return;
    element.scrollIntoView();
    element.focus({ preventScroll: true });
  }, [route]);

  return (
    <>
      <a className="skip" href="#content">Skip to the record</a>

      <nav className="views" aria-label="Views">
        <div className="page views-inner">
          <a className="views-home" href="#" aria-label={`${SITE}: back to the top`}><Mark /></a>
          <ul ref={links}>
            {VIEWS.map((v) => (
              <li key={v.id}>
                <a href={`#${v.id}`} aria-current={v.id === route.view ? "page" : undefined}>{v.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {route.target === NOT_FOUND && (
        <div className="page">
          <p id={NOT_FOUND} tabIndex={-1} className="notice">
            This address does not lead to an entry in the record. The entry may have been renamed
            or removed.
          </p>
        </div>
      )}

      <div className="page">
        <Opening />
      </div>

      <main id="content" tabIndex={-1} className="page">
        {route.view === "timeline" && <Timeline target={route.target} />}
        {route.view === "ledger" && <Ledger target={route.target} />}
        {route.view === "seasons" && <Seasons target={route.target} />}
        {route.view === "next" && <WhatsNext target={route.target} />}
        {route.view === "latest" && <Latest />}
        <Method />
      </main>

      <footer className="colophon">
        <div className="page colophon-inner">
          <p className="colophon-name"><Mark /> {SITE}</p>
          <p>
            An independent personal project by Rowan Flynn. It is not affiliated with any club,
            league or governing body.
          </p>
          <ul>
            <li><a href="#method">How this record is kept</a></li>
            <li><a href={EDIT_HISTORY} rel="noopener">Edit history</a></li>
            <li><a href={REPO} rel="noopener">Source code</a></li>
            <li><a href={LICENCE} rel="noopener">Licence</a></li>
          </ul>
        </div>
      </footer>
    </>
  );
}

// The route follows the address. It starts at the timeline, which is what the
// build renders into the page, and moves to the address as soon as the app is
// running, before the browser paints again.
export function App() {
  const [route, setRoute] = useState(HOME);
  useLayoutEffect(() => {
    const follow = () => setRoute((previous) => resolve(window.location.hash, previous, viewOfRecord, moved));
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, []);
  return <Page route={route} />;
}
