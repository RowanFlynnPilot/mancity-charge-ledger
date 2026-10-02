import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Served from https://rowanflynnpilot.github.io/mancity-charge-ledger/
export default defineConfig({
  base: "/mancity-charge-ledger/",
  plugins: [react()],
});
