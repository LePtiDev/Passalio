import { describe, expect, it } from "vitest";
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
