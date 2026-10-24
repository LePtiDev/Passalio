import { describe, expect, it } from "vitest";
import { SETTINGS_NAVIGATION } from "./navigation";

describe("settings navigation", () => {
  it("links to the services settings", () => {
    expect(SETTINGS_NAVIGATION).toContainEqual(
      expect.objectContaining({ label: "Prestations", to: "/reglages/prestations" }),
    );
  });

  it("no longer links to the visit types settings", () => {
    expect(SETTINGS_NAVIGATION.map(({ to }) => to)).not.toContain("/reglages/types-de-passage");
  });
});
