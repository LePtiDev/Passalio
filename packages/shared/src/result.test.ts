import { describe, expect, it } from "vitest";
import { err, ok, type Result } from "./result";

const parsePositive = (value: number): Result<number, "not_positive"> =>
  value > 0 ? ok(value) : err("not_positive");

describe("Result", () => {
  it("wraps a success", () => {
    expect(parsePositive(3)).toEqual({ isOk: true, value: 3 });
  });

  it("wraps a business error", () => {
    expect(parsePositive(-1)).toEqual({ isOk: false, error: "not_positive" });
  });
});
