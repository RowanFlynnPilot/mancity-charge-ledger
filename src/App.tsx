import { useEffect, useRef, useState } from "react";
import { Latest } from "./components/Latest";
import { Ledger } from "./components/Ledger";
import { Masthead } from "./components/Masthead";
import { Method } from "./components/Method";
import { Seasons } from "./components/Seasons";
import { Timeline } from "./components/Timeline";
import { WhatsNext } from "./components/WhatsNext";
import { viewOfRecord } from "./data";
import { HOME, resolve, VIEWS, type Route } from "./route";

const SITE = "The Charge Ledger";

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
        <ul className="page" ref={links}>
          {VIEWS.map((v) => (
            <li key={v.id}>
              <a href={`#${v.id}`} aria-current={v.id === route.view ? "page" : undefined}>{v.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <main id="content" tabIndex={-1} className="page">
        {route.view === "timeline" && <Timeline target={route.target} />}
        {route.view === "ledger" && <Ledger target={route.target} />}
        {route.view === "seasons" && <Seasons target={route.target} />}
        {route.view === "next" && <WhatsNext target={route.target} />}
        {route.view === "latest" && <Latest />}
        <Method />
      </main>

      <footer className="page colophon">
        <p>{SITE} is an independent personal project by Rowan Flynn.</p>
      </footer>
    </>
  );
}
