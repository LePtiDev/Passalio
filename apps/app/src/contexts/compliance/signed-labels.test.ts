import { describe, expect, it } from "vitest";
import { numberOf, signedAtLabel } from "./signed-labels";

describe("signedAtLabel", () => {
  it("shows the signing day and time in Paris", () => {
    expect(signedAtLabel("2026-10-23T08:42:00.000Z")).toBe("23 oct. 2026 à 10:42");
  });

  it("uses the Paris day around midnight", () => {
    expect(signedAtLabel("2026-10-22T22:30:00.000Z")).toBe("23 oct. 2026 à 00:30");
  });
});

describe("numberOf", () => {
  it("pads the certificate number after its prefix", () => {
    expect(numberOf({ numberPrefix: "RD-2026-", number: 144 })).toBe("RD-2026-0144");
  });
});
