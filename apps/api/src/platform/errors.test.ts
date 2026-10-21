import { ForbiddenError } from "@passalio/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import { TRACE_HEADER } from "./trace";

afterEach(() => {
  vi.restoreAllMocks();
});

const appThrowing = (error: Error) =>
  createApp().get("/boom", () => {
    throw error;
  });

describe("handleError", () => {
  it("answers 403 with the trace id on a ForbiddenError", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await appThrowing(new ForbiddenError("documents:sign")).request("/boom");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "forbidden",
      traceId: response.headers.get(TRACE_HEADER),
    });
  });

  it("answers 500 without leaking the message and logs it", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await appThrowing(new Error("secret detail")).request("/boom");
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "internal",
      traceId: response.headers.get(TRACE_HEADER),
    });
    expect(String(logged.mock.calls[0]?.[0])).toContain("unhandled_error");
  });
});
