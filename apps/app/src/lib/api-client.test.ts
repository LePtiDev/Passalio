import { afterEach, describe, expect, it, vi } from "vitest";
import * as z from "zod";
import { apiRequest, shortTraceId } from "./api-client";
import { errorMessage } from "./errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

const respond = (body: unknown, status: number) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(body, { status, headers: { "x-trace-id": "abcdef0123456789" } }),
    ),
  );

describe("apiRequest", () => {
  it("returns the parsed body", async () => {
    respond({ value: 1 }, 200);
    expect(await apiRequest("/x", z.object({ value: z.number() }))).toEqual({
      isOk: true,
      value: { value: 1 },
    });
  });

  it("returns the error code and the trace id", async () => {
    respond({ error: "already_member", traceId: "0123456789abcdef" }, 409);
    expect(await apiRequest("/x", z.unknown())).toEqual({
      isOk: false,
      error: { code: "already_member", traceId: "0123456789abcdef" },
    });
  });

  it("reports a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    expect(await apiRequest("/x", z.unknown())).toEqual({
      isOk: false,
      error: { code: "network", traceId: null },
    });
  });
});

describe("error display", () => {
  it("shows the first 8 characters of the trace id", () => {
    expect(shortTraceId("0123456789abcdef")).toBe("01234567");
  });

  it("falls back to a generic message for an unknown code", () => {
    expect(errorMessage("something_new")).toBe(errorMessage("internal"));
    expect(errorMessage("already_member")).toContain("déjà");
  });
});
