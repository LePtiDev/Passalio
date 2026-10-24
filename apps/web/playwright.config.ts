import { defineConfig, devices } from "@playwright/test";

const PORT = 4322;
const chromiumPath = process.env["PLAYWRIGHT_CHROMIUM_PATH"];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    launchOptions: chromiumPath === undefined ? {} : { executablePath: chromiumPath },
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `pnpm build && PORT=${PORT} node scripts/serve-dist.ts`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
});
