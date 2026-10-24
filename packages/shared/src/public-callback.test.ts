import { describe, expect, it } from "vitest";
import { publicCallbackRequest } from "./public-callback";

const VALID = {
  firstName: " Julien ",
  company: "",
  phone: "0612345678",
  postalCode: "94100",
  slot: "morning",
  message: null,
  pagePath: "/sans-reseau",
  turnstileToken: "token",
};

describe("publicCallbackRequest", () => {
  it("accepts a callback request and trims what the visitor typed", () => {
    expect(publicCallbackRequest.parse(VALID)).toEqual({
      ...VALID,
      firstName: "Julien",
      company: null,
    });
  });

  it.each([
    ["an empty first name", { firstName: "  " }],
    ["a number that is not French", { phone: "+44 20 7946 0958" }],
    ["a number with spaces", { phone: "06 12 34 56 78" }],
    ["a postal code of four digits", { postalCode: "9410" }],
    ["an unknown slot", { slot: "night" }],
    ["a page path with a domain", { pagePath: "https://evil.example" }],
    ["a message too long", { message: "a".repeat(1001) }],
    ["a missing anti-robot token", { turnstileToken: "" }],
  ])("refuses %s", (_case, change) => {
    expect(publicCallbackRequest.safeParse({ ...VALID, ...change }).success).toBe(false);
  });
});
