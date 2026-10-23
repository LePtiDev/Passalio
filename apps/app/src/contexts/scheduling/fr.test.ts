import { describe, expect, it } from "vitest";
import { formatEuros } from "./fr";

const withPlainSpaces = (text: string) => text.replaceAll(/\s/g, " ");

describe("formatEuros", () => {
  it("writes whole euros without decimals", () => {
    expect(withPlainSpaces(formatEuros(7500))).toBe("75 €");
    expect(withPlainSpaces(formatEuros(0))).toBe("0 €");
  });

  it("writes cents with a comma", () => {
    expect(withPlainSpaces(formatEuros(7505))).toBe("75,05 €");
    expect(withPlainSpaces(formatEuros(1999))).toBe("19,99 €");
  });

  it("writes cents with two digits", () => {
    expect(withPlainSpaces(formatEuros(7550))).toBe("75,50 €");
  });

  it("groups thousands", () => {
    expect(withPlainSpaces(formatEuros(125000))).toBe("1 250 €");
  });

  it("keeps the euro sign apart from the amount with a non-breaking space", () => {
    expect(formatEuros(7500)).toMatch(/^75[  ]€$/);
  });
});
