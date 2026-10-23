import { describe, expect, it } from "vitest";
import { createTraceRecorder } from "./auth-errors";

describe("createTraceRecorder", () => {
  it("maps a Better Auth error code and keeps the trace id of the response", () => {
    const recorder = createTraceRecorder();
    recorder.onResponse({ response: new Response(null, { headers: { "x-trace-id": "abc123" } }) });
    expect(recorder.toApiError({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" })).toEqual({
      code: "invalid_credentials",
      traceId: "abc123",
    });
  });

  it("reports too many attempts on a 429", () => {
    expect(createTraceRecorder().toApiError({ status: 429 })).toEqual({
      code: "rate_limited",
      traceId: null,
    });
  });

  it("falls back to an internal error for an unknown code", () => {
    expect(createTraceRecorder().toApiError({ status: 500, code: "SOMETHING" }).code).toBe(
      "internal",
    );
  });

  it("asks to reload a page that sends outdated terms", () => {
    expect(createTraceRecorder().toApiError({ status: 400, code: "TERMS_NOT_ACCEPTED" }).code).toBe(
      "terms_outdated",
    );
  });

  it("reports a failed anti-robot check", () => {
    const recorder = createTraceRecorder();
    expect(recorder.toApiError({ status: 403, code: "VERIFICATION_FAILED" }).code).toBe(
      "captcha_failed",
    );
    expect(recorder.toApiError({ status: 400, code: "MISSING_RESPONSE" }).code).toBe(
      "captcha_failed",
    );
  });
});
