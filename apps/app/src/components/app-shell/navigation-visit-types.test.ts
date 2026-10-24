import { describe, expect, it } from "vitest";
import { SETTINGS_NAVIGATION } from "./navigation";

describe("settings navigation", () => {
  it("links to the visit types settings", () => {
    expect(SETTINGS_NAVIGATION).toContainEqual(
      expect.objectContaining({ label: "Types de passage", to: "/reglages/types-de-passage" }),
    );
  });
});
