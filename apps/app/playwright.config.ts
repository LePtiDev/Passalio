import { defineConfig } from "@playwright/test";

const E2E_STATE = ".e2e/state";
export const API_LOG_PATH = ".e2e/api.log";

const chromiumPath = process.env["PLAYWRIGHT_CHROMIUM_PATH"];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 360, height: 760 },
    locale: "fr-FR",
    launchOptions: chromiumPath === undefined ? {} : { executablePath: chromiumPath },
  },
  webServer: [
    {
      command: [
        `rm -rf ${E2E_STATE} && mkdir -p .e2e`,
        `cd ../api && npx wrangler d1 migrations apply DB --local --persist-to ../app/${E2E_STATE}`,
        `npx wrangler dev --port 8787 --persist-to ../app/${E2E_STATE} --var BETTER_AUTH_SECRET:e2e-secret-long-enough-for-better-auth > ../app/${API_LOG_PATH} 2>&1`,
      ].join(" && "),
      url: "http://localhost:8787/health",
      env: { CI: "true" },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npx vite --port 5173 --strictPort",
      url: "http://localhost:5173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
