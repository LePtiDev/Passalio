import type { Page, Request } from "@playwright/test";

export const FAKE_TRACE_ID = "5e1f0c2ab7d94c3e8f61a0b2c4d6e8f0";

export const FAKE_SHORT_TRACE_ID = FAKE_TRACE_ID.slice(0, 8);

export const SHORT_TRACE_CODE = /^Code : [0-9a-f]{8}$/;

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type UrlMatcher = Parameters<Page["route"]>[0];

const matches = (request: Request, method: HttpMethod | undefined) =>
  method === undefined || request.method() === method;

export const holdResponses = async (page: Page, url: UrlMatcher, method?: HttpMethod) => {
  const releases: Array<() => void> = [];
  let isReleased = false;
  await page.route(url, async (route) => {
    if (isReleased || !matches(route.request(), method)) {
      await route.fallback();
      return;
    }
    await new Promise<void>((resolve) => {
      releases.push(resolve);
    });
    await route.fallback();
  });
  return () => {
    isReleased = true;
    for (const release of releases) {
      release();
    }
  };
};

export const failWithServerError = async (page: Page, url: UrlMatcher, method?: HttpMethod) => {
  await page.route(url, async (route) => {
    if (!matches(route.request(), method)) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      headers: { "x-trace-id": FAKE_TRACE_ID },
      body: JSON.stringify({ error: "internal", traceId: FAKE_TRACE_ID }),
    });
  });
  return () => page.unroute(url);
};
