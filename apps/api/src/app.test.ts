import { describe, expect, it } from "vitest";
import { app } from "./app";
import { TRACE_HEADER } from "./platform/trace";

describe("GET /health", () => {
  it("answers ok with a new trace id", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get(TRACE_HEADER)).toMatch(/^[0-9a-f]{32}$/);
  });

  it("continues the trace sent by the browser", async () => {
    const traceId = "0123456789abcdef0123456789abcdef";
    const response = await app.request("/health", {
      headers: { "sentry-trace": `${traceId}-0123456789abcdef-1` },
    });
    expect(response.headers.get(TRACE_HEADER)).toBe(traceId);
  });
});
