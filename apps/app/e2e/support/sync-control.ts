import { expect, type BrowserContext, type Page } from "@playwright/test";
import { syncIndicator } from "./customers";

export const SYNC_PUSH_ROUTE = "**/api/sync/push";

export const SYNC_PULL_ROUTE = "**/api/sync/pull**";

export const FAILURE_TRACE_ID = "4f9c2a1b-7d3e-4c5a-9b8f-0e1d2c3b4a59";

export const SHORT_FAILURE_CODE = `Code : ${FAILURE_TRACE_ID.slice(0, 8)}`;

export const holdSyncPush = async (context: BrowserContext) => {
  const gate: { open: () => void } = { open: () => undefined };
  const opened = new Promise<void>((resolve) => {
    gate.open = resolve;
  });
  await context.route(SYNC_PUSH_ROUTE, async (route) => {
    await opened;
    await route.fallback();
  });
  return {
    release: async () => {
      gate.open();
      await context.unroute(SYNC_PUSH_ROUTE);
    },
  };
};

export const failSyncRoute = async (context: BrowserContext, pattern: string) => {
  await context.route(pattern, (route) =>
    route.fulfill({ status: 500, json: { error: "internal", traceId: FAILURE_TRACE_ID } }),
  );
};

export const cutSyncRoute = async (context: BrowserContext, pattern: string) => {
  await context.route(pattern, (route) => route.abort("internetdisconnected"));
};

const PENDING_COUNT = /(\d+) à envoyer$/;

export const pendingCountOf = async (page: Page) => {
  const indicator = syncIndicator(page, PENDING_COUNT);
  await expect(indicator).toBeVisible();
  const match = PENDING_COUNT.exec((await indicator.textContent())?.trim() ?? "");
  return Number(match?.[1] ?? Number.NaN);
};

export const expectPendingCountAbove = async (page: Page, previous: number) => {
  await expect.poll(() => pendingCountOf(page)).toBeGreaterThan(previous);
  return pendingCountOf(page);
};
