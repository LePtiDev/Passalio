import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createLogger", () => {
  it("writes one JSON line carrying the trace id", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    createLogger("trace-1").info({ event: "customer_created", count: 2 });
    const line: unknown = JSON.parse(String(info.mock.calls[0]?.[0]));
    expect(line).toMatchObject({
      level: "info",
      trace_id: "trace-1",
      event: "customer_created",
      count: 2,
    });
  });

  it("routes errors to console.error", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    createLogger("trace-1").error({ event: "boom" });
    expect(error).toHaveBeenCalledOnce();
  });
});
