import type { Page, Route } from "@playwright/test";

export type ApiMatcher = (url: URL) => boolean;

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export const apiPathIs =
  (path: string): ApiMatcher =>
  (url) =>
    url.pathname === `/api${path}`;

export const uniqueTraceId = () => crypto.randomUUID().replaceAll("-", "").slice(0, 16);

export const shortTraceIdOf = (traceId: string) => traceId.slice(0, 8);

type Failure = { readonly status: number; readonly code: string; readonly traceId: string };

const doNothing = () => undefined;

const closedGate = () => {
  const opener = { open: doNothing };
  const gate = new Promise<void>((resolve) => {
    opener.open = () => {
      resolve();
      return undefined;
    };
  });
  return { gate, open: () => opener.open() };
};

export type StubbedApi = {
  readonly fail: (traceId: string, code?: string, status?: number) => void;
  readonly restore: () => Promise<void>;
  readonly heldRequests: () => number;
};

export const holdApi = async (
  page: Page,
  matcher: ApiMatcher,
  method: HttpMethod = "GET",
): Promise<StubbedApi> => {
  const { gate, open } = closedGate();
  let failure: Failure | undefined;
  let held = 0;
  const handler = async (route: Route) => {
    if (route.request().method() !== method) {
      await route.fallback();
      return;
    }
    held += 1;
    await gate;
    if (failure === undefined) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: failure.status,
      headers: { "x-trace-id": failure.traceId },
      json: { error: failure.code, traceId: failure.traceId },
    });
  };
  await page.route(matcher, handler);
  return {
    fail: (traceId, code = "internal", status = 500) => {
      failure = { status, code, traceId };
      open();
    },
    restore: async () => {
      failure = undefined;
      open();
      await page.unroute(matcher, handler);
    },
    heldRequests: () => held,
  };
};

export const respondWithJson = async (
  page: Page,
  matcher: ApiMatcher,
  body: unknown,
  method: HttpMethod = "GET",
) => {
  await page.route(matcher, async (route) => {
    if (route.request().method() !== method) {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 200, json: body });
  });
};
