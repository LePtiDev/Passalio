import { vi } from "vitest";
import type { FakeApi } from "./fake-api";
import type { installTurnstile } from "./identity-replies";

const CAPTCHA_HEADER_NAME = "x-captcha-response";

const pathOf = (input: RequestInfo | URL) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  return new URL(url, "http://localhost").pathname;
};

export const captchaTokensSentTo = (api: FakeApi, path: string) =>
  api.fetch.mock.calls
    .filter(([input]) => pathOf(input) === path)
    .map(([, init]) => new Headers(init?.headers).get(CAPTCHA_HEADER_NAME));

export const renewTokenOnReset = (
  turnstile: ReturnType<typeof installTurnstile>,
  nextToken: string,
) => {
  vi.mocked(turnstile.reset).mockImplementation(() => {
    for (const [, options] of vi.mocked(turnstile.render).mock.calls) {
      queueMicrotask(() => options.callback(nextToken));
    }
  });
};
