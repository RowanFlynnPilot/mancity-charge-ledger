import { useEffect, useRef, useState } from "react";
import { Latest } from "./components/Latest";
import { Ledger } from "./components/Ledger";
import { Mark } from "./components/Mark";
import { Masthead } from "./components/Masthead";
import { Method } from "./components/Method";
import { Seasons } from "./components/Seasons";
import { Timeline } from "./components/Timeline";
import { WhatsNext } from "./components/WhatsNext";
import { viewOfRecord } from "./data";
import { HOME, resolve, VIEWS, type Route } from "./route";
import { EDIT_HISTORY, REPO, SITE } from "./site";

function useRoute(): Route {
  const [route, setRoute] = useState(() => resolve(window.location.hash, HOME, viewOfRecord));
  useEffect(() => {
    const onHashChange = () => setRoute((previous) => resolve(window.location.hash, previous, viewOfRecord));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return route;
}

export function App() {
  const route = useRoute();
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
    const element = document.getElementById(route.target);
    if (element === null) return;
    element.scrollIntoView();
    element.focus({ preventScroll: true });
  }, [route]);

  return (
    <>
      <a className="skip" href="#content">Skip to the record</a>
      <div className="page">
        <Masthead />
      </div>

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
          </ul>
        </div>
      </footer>
    </>
  );
}
