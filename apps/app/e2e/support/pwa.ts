import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { expect, type BrowserContext, type Page } from "@playwright/test";
import { PWA_BUILD_ENV } from "../../playwright.pwa.config";
import { E2E_BUILD_META } from "../../vite.pwa-e2e.config";

const APP_DIR = fileURLToPath(new URL("../..", import.meta.url));

const BUILD_TIMEOUT_MS = 240_000;

const run = promisify(execFile);

export const waitForServiceWorkerControl = async (page: Page) => {
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), {
      timeout: 30_000,
    })
    .toBe(true);
};

export const buildIdOf = (page: Page) => page.locator(`meta[name="${E2E_BUILD_META}"]`);

export const deployNewVersion = async (buildId: string) => {
  await run(
    "npx",
    ["vite", "build", "--mode", "development", "--config", "vite.pwa-e2e.config.ts"],
    {
      cwd: APP_DIR,
      env: { ...process.env, ...PWA_BUILD_ENV, E2E_BUILD_ID: buildId },
      timeout: BUILD_TIMEOUT_MS,
    },
  );
};

export const returnToTab = (page: Page) =>
  page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });

const SYNC_ROUTE = "**/api/sync/**";

export const cutSyncConnection = (context: BrowserContext) =>
  context.route(SYNC_ROUTE, (route) => route.abort("internetdisconnected"));

export const restoreSyncConnection = (context: BrowserContext) => context.unroute(SYNC_ROUTE);
