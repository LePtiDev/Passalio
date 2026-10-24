import { defineConfig } from "@playwright/test";
import baseConfig, { API_LOG_PATH, API_PORT, APP_PORT } from "./playwright.config";

export const PWA_DIST_DIR = `${API_LOG_PATH.replace(/api\.log$/, "")}pwa-dist`;

export const PWA_BUILD_ENV = {
  NODE_ENV: "development",
  E2E_OUT_DIR: PWA_DIST_DIR,
} as const;

const baseServers = baseConfig.webServer;
const apiServers = (Array.isArray(baseServers) ? baseServers : []).slice(0, 1);

export default defineConfig({
  ...baseConfig,
  testDir: "./e2e-pwa",
  webServer: [
    ...apiServers,
    {
      command: [
        "npx vite build --mode development --config vite.pwa-e2e.config.ts",
        `npx vite preview --config vite.pwa-e2e.config.ts --port ${APP_PORT} --strictPort`,
      ].join(" && "),
      url: `http://localhost:${APP_PORT}`,
      env: { ...PWA_BUILD_ENV, API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
