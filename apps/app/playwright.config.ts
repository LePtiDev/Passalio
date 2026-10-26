import { defineConfig } from "@playwright/test";

const portFromEnv = (name: string, fallback: number) => {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return fallback;
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`${name} must be a TCP port, received "${value}"`);
  }
  return port;
};

const DEFAULT_API_PORT = 8787;

export const API_PORT = portFromEnv("E2E_API_PORT", DEFAULT_API_PORT);
export const APP_PORT = portFromEnv("E2E_APP_PORT", 5173);
export const INSPECTOR_PORT = portFromEnv("E2E_INSPECTOR_PORT", 9229);

export const API_URL = `http://localhost:${API_PORT}`;
export const APP_URL = `http://localhost:${APP_PORT}`;

const E2E_DIR = API_PORT === DEFAULT_API_PORT ? ".e2e" : `.e2e/port-${API_PORT}`;
const E2E_STATE = `${E2E_DIR}/state`;
export const API_LOG_PATH = `${E2E_DIR}/api.log`;

const chromiumPath = process.env["PLAYWRIGHT_CHROMIUM_PATH"];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: APP_URL,
    viewport: { width: 360, height: 760 },
    locale: "fr-FR",
    launchOptions: chromiumPath === undefined ? {} : { executablePath: chromiumPath },
  },
  webServer: [
    {
      command: [
        `rm -rf ${E2E_STATE} && mkdir -p ${E2E_DIR}`,
        `cd ../api && npx wrangler d1 migrations apply DB --local --persist-to ../app/${E2E_STATE}`,
        [
          `npx wrangler dev --port ${API_PORT} --inspector-port ${INSPECTOR_PORT} --test-scheduled`,
          `--persist-to ../app/${E2E_STATE}`,
          "--var BETTER_AUTH_SECRET:e2e-secret-long-enough-for-better-auth",
          `--var BETTER_AUTH_URL:${APP_URL} --var APP_URL:${APP_URL}`,
          `> ../app/${API_LOG_PATH} 2>&1`,
        ].join(" "),
      ].join(" && "),
      url: `${API_URL}/health`,
      env: { CI: "true" },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${APP_PORT} --strictPort`,
      url: APP_URL,
      env: { API_PROXY_TARGET: API_URL },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
