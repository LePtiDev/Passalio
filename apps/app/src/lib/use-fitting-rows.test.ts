import { describe, expect, it } from "vitest";
import { rowsThatFit } from "./use-fitting-rows";

describe("rowsThatFit", () => {
  it("fits as many whole rows as the space allows", () => {
    expect(rowsThatFit(560, 55)).toBe(10);
  });

  it("never shows fewer than five rows on a small screen", () => {
    expect(rowsThatFit(120, 73)).toBe(5);
    expect(rowsThatFit(-40, 73)).toBe(5);
  });

  it("never asks for more than fifty rows", () => {
    expect(rowsThatFit(9000, 55)).toBe(50);
  });
});
