import { describe, expect, it } from "vitest";
import { documentNumberLabel } from "./compliance";

describe("documentNumberLabel", () => {
  it("pads the number to four digits after the prefix", () => {
    expect(documentNumberLabel("RD-2026-", 7)).toBe("RD-2026-0007");
    expect(documentNumberLabel("", 142)).toBe("0142");
  });

  it("keeps numbers longer than four digits whole", () => {
    expect(documentNumberLabel("A-", 123_456)).toBe("A-123456");
  });
});
