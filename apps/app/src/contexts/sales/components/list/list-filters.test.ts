import { describe, expect, it } from "vitest";
import { activeFiltersOf, selectedLabelOf, type FilterGroup } from "./list-filters";

const departmentGroup = (value: string | null, hasChip = true): FilterGroup => ({
  key: "departement",
  label: "Département",
  anyLabel: "Tous les départements",
  value,
  options: [
    { value: "94", label: "Val-de-Marne (94)" },
    { value: "75", label: "Paris (75)" },
  ],
  hasChip,
  onChange: () => undefined,
});

describe("selectedLabelOf", () => {
  it("shows the label of the chosen option", () => {
    expect(selectedLabelOf(departmentGroup("94"))).toBe("Val-de-Marne (94)");
  });

  it("shows the any label when nothing is chosen", () => {
    expect(selectedLabelOf(departmentGroup(null))).toBe("Tous les départements");
  });

  it("shows the any label when the chosen value is no longer offered", () => {
    expect(selectedLabelOf(departmentGroup("13"))).toBe("Tous les départements");
  });
});

describe("activeFiltersOf", () => {
  it("lists only groups with a chosen option that shows a chip", () => {
    const chosen = departmentGroup("94");
    const active = activeFiltersOf([chosen, departmentGroup(null), departmentGroup("75", false)]);
    expect(active).toEqual([
      { group: chosen, option: { value: "94", label: "Val-de-Marne (94)" } },
    ]);
  });
});
