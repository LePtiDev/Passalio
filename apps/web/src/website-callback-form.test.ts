import { describe, expect, it } from "vitest";
import {
  callbackFailureOf,
  invalidWebsiteCallbackFields,
  isPostalCode,
  websiteCallbackRequestBody,
} from "./callback-form";
import { turnstileSiteKey } from "./turnstile";

const draft = {
  firstName: " Julien ",
  company: "",
  phone: "06 12 34 56 78",
  postalCode: " 94 100 ",
  slot: "afternoon",
  message: "",
  pagePath: "/sans-reseau",
};

describe("website callback form", () => {
  it("accepts a five-digit postal code, spaces aside", () => {
    expect([isPostalCode("94100"), isPostalCode("94 100"), isPostalCode("2A004")]).toEqual([
      true,
      true,
      false,
    ]);
    expect([isPostalCode("9410"), isPostalCode("941000"), isPostalCode("")]).toEqual([
      false,
      false,
      false,
    ]);
  });

  it("names the postal code after the first name and the phone", () => {
    expect(invalidWebsiteCallbackFields(draft)).toEqual([]);
    expect(
      invalidWebsiteCallbackFields({ ...draft, firstName: "", phone: "06", postalCode: "94" }),
    ).toEqual(["firstName", "phone", "postalCode"]);
  });

  it("sends the postal code without spaces and the anti-robot token", () => {
    expect(websiteCallbackRequestBody(draft, "jeton")).toEqual({
      firstName: "Julien",
      company: null,
      phone: "0612345678",
      postalCode: "94100",
      slot: "afternoon",
      message: null,
      pagePath: "/sans-reseau",
      turnstileToken: "jeton",
    });
  });

  it("tells a visitor over the limit apart from other failures", () => {
    expect([callbackFailureOf(429), callbackFailureOf(403), callbackFailureOf(500)]).toEqual([
      "too_many_requests",
      "failed",
      "failed",
    ]);
  });

  it("uses the always-passing test key only in development", () => {
    expect(turnstileSiteKey(true)).toBe("1x00000000000000000000AA");
    expect(turnstileSiteKey(false)).toBe("0x4AAAAAAFiIzDUiQbmqacq6");
  });
});
