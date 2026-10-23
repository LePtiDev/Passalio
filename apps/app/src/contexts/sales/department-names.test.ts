import { describe, expect, it } from "vitest";
import { departmentLocative } from "./department-locatives";
import { departmentLabel, departmentName } from "./department-names";

describe("departmentLabel", () => {
  it("names a known department with its code", () => {
    expect(departmentLabel("94")).toBe("Val-de-Marne (94)");
    expect(departmentLabel("2A")).toBe("Corse-du-Sud (2A)");
  });

  it("falls back to the code for an unknown department", () => {
    expect(departmentLabel("99")).toBe("99");
  });
});

describe("departmentName", () => {
  it("names a department without its code", () => {
    expect(departmentName("94")).toBe("Val-de-Marne");
    expect(departmentName("99")).toBe("99");
  });
});

describe("departmentLocative", () => {
  it("says where, with the right article", () => {
    expect(departmentLocative("94")).toBe("dans le Val-de-Marne");
    expect(departmentLocative("93")).toBe("en Seine-Saint-Denis");
    expect(departmentLocative("92")).toBe("dans les Hauts-de-Seine");
    expect(departmentLocative("91")).toBe("dans l'Essonne");
    expect(departmentLocative("75")).toBe("à Paris");
    expect(departmentLocative("99")).toBe("dans le département 99");
  });

  it("covers every department", () => {
    for (const code of ["01", "2A", "2B", "90", "976"]) {
      expect(departmentLocative(code)).not.toContain("département");
    }
  });
});
