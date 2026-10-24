import { onTestFinished } from "vitest";
import type { FakeApi } from "./fake-api";

const DEFAULT_VIEWPORT = { width: 1024, height: 768 } as const;

const MOBILE_VIEWPORT = { width: 360, height: 760 } as const;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const propertyOf = (owner: unknown, key: string): unknown =>
  isRecord(owner) ? Reflect.get(owner, key) : undefined;

const happyDom = () => {
  const api: unknown = Reflect.get(globalThis, "happyDOM");
  if (!isRecord(api)) {
    throw new Error("the happy-dom window API is not available");
  }
  return api;
};

const fetchSettings = () => {
  const settings = propertyOf(propertyOf(happyDom(), "settings"), "fetch");
  if (!isRecord(settings)) {
    throw new Error("the happy-dom fetch settings are not available");
  }
  return settings;
};

type InterceptedRequest = { readonly request: Request };

const bodyOf = async (request: Request) =>
  request.method === "GET" || request.method === "HEAD" ? null : await request.text();

export const routeWindowFetchToFakeApi = (api: FakeApi) => {
  const settings = fetchSettings();
  Reflect.set(settings, "interceptor", {
    beforeAsyncRequest: async ({ request }: InterceptedRequest) =>
      api.fetch(request.url, { method: request.method, body: await bodyOf(request) }),
  });
  onTestFinished(() => {
    Reflect.set(settings, "interceptor", null);
  });
};

const setViewport = (viewport: { readonly width: number; readonly height: number }) => {
  const api = happyDom();
  const setter: unknown = Reflect.get(api, "setViewport");
  if (typeof setter !== "function") {
    throw new Error("the happy-dom viewport cannot be changed");
  }
  Reflect.apply(setter, api, [viewport]);
};

export const showMobileViewport = () => {
  setViewport(MOBILE_VIEWPORT);
  onTestFinished(() => setViewport(DEFAULT_VIEWPORT));
};
