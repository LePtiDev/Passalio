import { describe, expect, it } from "vitest";
import { changeCount, changedSettings } from "./changed-settings";

describe("changedSettings", () => {
  it("keeps only the fields whose value changed", () => {
    expect(
      changedSettings(
        { name: "Ramonage Dupont", phone: null, nextDocumentNumber: 1 },
        { name: "Ramonage Dupont", phone: "0601020304", nextDocumentNumber: 1 },
      ),
    ).toEqual({ phone: "0601020304" });
  });

  it("sends a cleared field as null", () => {
    expect(changedSettings({ footerText: "Assurance AXA" }, { footerText: null })).toEqual({
      footerText: null,
    });
  });

  it("counts the changed fields", () => {
    expect(
      changeCount(
        { brandColor: "#0F2A44", website: null },
        { brandColor: "#0E7C5A", website: "exemple.fr" },
      ),
    ).toBe(2);
    expect(changeCount({ brandColor: "#0F2A44" }, { brandColor: "#0F2A44" })).toBe(0);
  });
});
