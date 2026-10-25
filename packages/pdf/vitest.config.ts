import { defineConfig } from "vitest/config";

const PAGE_RENDERING_TIMEOUT_MS = 30_000;

export default defineConfig({
  test: { testTimeout: PAGE_RENDERING_TIMEOUT_MS },
});
