import { describe, expect, it } from "vitest";
import { colorAt, TECHNICIAN_COLORS } from "./technician-colors";

describe("technician colors", () => {
  it("has eight distinct colors, blue first", () => {
    expect(TECHNICIAN_COLORS).toHaveLength(8);
    expect(new Set(TECHNICIAN_COLORS.map(({ bar }) => bar)).size).toBe(8);
    expect(colorAt(0).bar).toBe("#3B82F6");
  });

  it("loops back to the first color after the eighth", () => {
    expect(colorAt(8)).toBe(colorAt(0));
    expect(colorAt(13)).toBe(colorAt(5));
  });

  it("styles blocks and avatars with the same color", () => {
    const color = colorAt(2);
    expect(color.blockStyle).toEqual({
      background: color.background,
      borderColor: color.bar,
      color: color.text,
    });
    expect(color.avatarStyle).toEqual({ background: color.background, color: color.text });
  });
});
