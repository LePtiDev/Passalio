import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it("keeps the first letter of the first two words", () => {
    expect(initialsOf("ramonage  dupont et fils")).toBe("RD");
    expect(initialsOf("Jean")).toBe("J");
    expect(initialsOf(" ")).toBe("");
  });

  it("skips the legal form of a company", () => {
    expect(initialsOf("SCI Les Tilleuls")).toBe("LT");
    expect(initialsOf("Ramonage Dupont SARL")).toBe("RD");
    expect(initialsOf("SAS")).toBe("S");
  });
});
