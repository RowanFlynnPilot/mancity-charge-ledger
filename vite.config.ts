import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// Served from https://rowanflynnpilot.github.io/mancity-charge-ledger/
const BASE = "/mancity-charge-ledger/";

// The three font files the first screen is set in: Literata upright and italic,
// and Archivo, each in its Latin subset.
const FIRST_SCREEN_FONT = /^assets\/(literata-latin-opsz-(normal|italic)|archivo-latin-wdth-normal)-[\w-]+\.woff2$/;

// Asks the browser to fetch those fonts alongside the stylesheet, not after it
// has read it. The built files carry a hash in their names, so the tags are
// written from the list of files the build produced. The dev server has no such
// list and adds nothing.
function preloadFonts(): Plugin {
  return {
    name: "preload-fonts",
    transformIndexHtml: {
      order: "post",
      handler: (_html, { bundle }) =>
        Object.keys(bundle ?? {})
          .filter((file) => FIRST_SCREEN_FONT.test(file))
          .map((file) => ({
            tag: "link",
            // Fonts are fetched without credentials, so the preload must be too, or it is wasted.
            attrs: { rel: "preload", as: "font", type: "font/woff2", href: BASE + file, crossorigin: true },
            injectTo: "head" as const,
          })),
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [react(), preloadFonts()],
});
