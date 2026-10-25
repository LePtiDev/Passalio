import { LOGO_MAX_BASE64_LENGTH } from "@passalio/trades";
import { describe, expect, it, vi } from "vitest";
import { fittingLogo } from "./logo-for-pdf";

describe("fittingLogo", () => {
  it("keeps the PNG logo when it fits in the signed certificate", () => {
    const jpeg = vi.fn<() => string>(() => "jpeg");
    expect(fittingLogo("A".repeat(LOGO_MAX_BASE64_LENGTH), jpeg)).toEqual({
      format: "png",
      base64: "A".repeat(LOGO_MAX_BASE64_LENGTH),
    });
    expect(jpeg).not.toHaveBeenCalled();
  });

  it("falls back to a JPEG logo when the PNG is too large", () => {
    expect(fittingLogo("A".repeat(LOGO_MAX_BASE64_LENGTH + 1), () => "/9j/")).toEqual({
      format: "jpeg",
      base64: "/9j/",
    });
  });
});
