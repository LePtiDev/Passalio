import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it("keeps the first letter of the first two words", () => {
    expect(initialsOf("ramonage  dupont et fils")).toBe("RD");
    expect(initialsOf("Jean")).toBe("J");
    expect(initialsOf(" ")).toBe("");
  });
});
