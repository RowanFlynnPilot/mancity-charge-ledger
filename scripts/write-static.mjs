// The last step of `npm run build`. By now Vite has built the site into dist/
// and the static entry (src/static.tsx) into dist-static/. This writes what the
// app bundle alone does not give a reader:
//
//   dist/index.html   the page rendered into the empty root, so the record is in
//                     the HTML that is served and does not wait for JavaScript
//   dist/atom.xml     the record's own feed of entries
//   dist/data/        the record's JSON files, at addresses others can fetch
//
// Anything missing raises, and the build fails.
import { cpSync, readFileSync, writeFileSync } from "node:fs";
import { feed, page } from "../dist-static/static.js";

const INDEX = "dist/index.html";
const EMPTY_ROOT = '<div id="root"></div>';

const html = readFileSync(INDEX, "utf8");
if (!html.includes(EMPTY_ROOT)) throw new Error(`${INDEX} has no empty root to render the page into`);

const markup = page();
if (!markup.includes('id="timeline"')) throw new Error("the rendered page does not hold the timeline");
// A function, so that nothing in the markup is read as a replacement pattern.
writeFileSync(INDEX, html.replace(EMPTY_ROOT, () => `<div id="root">${markup}</div>`));

writeFileSync("dist/atom.xml", feed());
cpSync("data", "dist/data", { recursive: true });

const preloads = html.match(/<link rel="preload"[^>]*>/g) ?? [];
console.log(`static: ${markup.length} characters of markup written into ${INDEX}`);
console.log(`static: ${preloads.length} fonts preloaded`);
for (const tag of preloads) console.log(`static:   ${tag}`);
console.log("static: dist/atom.xml and dist/data/ written");
