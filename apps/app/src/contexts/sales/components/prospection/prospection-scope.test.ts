import { describe, expect, it } from "vitest";
import type { ProspectPin } from "../../sales-api";
import { neighbourOf, pinsMatching, webAddressOf } from "./prospection-scope";

const pin = (id: string, name: string, city: string | null): ProspectPin => ({
  id,
  name,
  city,
  phone: null,
  stage: "to_qualify",
  latitude: 48.8,
  longitude: 2.4,
});

const PINS = [
  pin("a", "Ramonage Créteil", "Créteil"),
  pin("b", "Ott", "Alfortville"),
  pin("c", "Sans ville", null),
];

describe("pinsMatching", () => {
  it("keeps every pin without a search", () => {
    expect(pinsMatching(PINS, "  ")).toBe(PINS);
  });

  it("matches the name or the city, ignoring accents and case", () => {
    expect(pinsMatching(PINS, "creteil").map(({ id }) => id)).toEqual(["a"]);
    expect(pinsMatching(PINS, "ALFORT").map(({ id }) => id)).toEqual(["b"]);
  });
});

describe("neighbourOf", () => {
  it("selects the next company, or the previous one at the end", () => {
    expect(neighbourOf(["a", "b", "c"], "a")).toBe("b");
    expect(neighbourOf(["a", "b", "c"], "c")).toBe("b");
    expect(neighbourOf(["a"], "a")).toBeNull();
  });

  it("keeps a company that is not in the list", () => {
    expect(neighbourOf(["a", "b"], "z")).toBe("z");
  });
});

describe("webAddressOf", () => {
  it("shows a website without its protocol", () => {
    expect(webAddressOf("https://www.ramonage-94.fr/")).toBe("ramonage-94.fr");
    expect(webAddressOf("ramonage.fr")).toBe("ramonage.fr");
  });
});
