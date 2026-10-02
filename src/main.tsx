import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
import "@fontsource-variable/archivo/wdth.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// The build renders the page into index.html, and the app takes that markup
// over. The dev server serves an empty root, so there the app renders it.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
