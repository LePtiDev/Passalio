import { describe, expect, it } from "vitest";
import {
  callbackRequestBody,
  formatPhone,
  invalidCallbackFields,
  isFrenchPhone,
  normalizePhone,
  shortTraceId,
} from "./callback-form";

const draft = {
  firstName: " Julien ",
  company: "",
  phone: "06 12 34 56 78",
  slot: "afternoon",
  message: "  ",
  pagePath: "/sans-reseau",
};

describe("callback form", () => {
  it("accepts French numbers written in the usual ways", () => {
    expect(isFrenchPhone("06 12 34 56 78")).toBe(true);
    expect(isFrenchPhone("06.12.34.56.78")).toBe(true);
    expect(isFrenchPhone("+33 6 12 34 56 78")).toBe(true);
    expect(isFrenchPhone("0033612345678")).toBe(true);
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("0612345678");
  });

  it("refuses incomplete or foreign numbers", () => {
    expect(isFrenchPhone("06 12 34")).toBe(false);
    expect(isFrenchPhone("00 12 34 56 78")).toBe(false);
    expect(isFrenchPhone("+44 20 7946 0958")).toBe(false);
    expect(isFrenchPhone("")).toBe(false);
  });

  it("names the fields to fix", () => {
    expect(invalidCallbackFields(draft)).toEqual([]);
    expect(invalidCallbackFields({ ...draft, firstName: " ", phone: "06" })).toEqual([
      "firstName",
      "phone",
    ]);
  });

  it("sends trimmed values, a normalized number and nulls for empty optional fields", () => {
    expect(callbackRequestBody(draft)).toEqual({
      firstName: "Julien",
      company: null,
      phone: "0612345678",
      slot: "afternoon",
      message: null,
      pagePath: "/sans-reseau",
    });
  });

  it("falls back to the first slot when the slot is unknown", () => {
    expect(callbackRequestBody({ ...draft, slot: "midnight" }).slot).toBe("morning");
  });

  it("shows the number by pairs of digits", () => {
    expect(formatPhone("0612345678")).toBe("06 12 34 56 78");
  });

  it("shortens the trace id to eight characters", () => {
    expect(shortTraceId("0123456789abcdef")).toBe("01234567");
    expect(shortTraceId(null)).toBeNull();
    expect(shortTraceId("")).toBeNull();
  });
});
