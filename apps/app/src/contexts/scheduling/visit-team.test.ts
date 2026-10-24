import { describe, expect, it } from "vitest";
import { assignedTechniciansOf, isAssignedTo } from "./visit-team";

describe("assignedTechniciansOf", () => {
  it("lists every technician of a shared visit, lead first", () => {
    expect(
      assignedTechniciansOf({
        technicianUserId: "user-lead",
        technicianUserIds: ["user-lead", "user-second"],
      }),
    ).toEqual(["user-lead", "user-second"]);
  });

  it("falls back on the lead for a visit stored without a list", () => {
    expect(assignedTechniciansOf({ technicianUserId: "user-lead", technicianUserIds: [] })).toEqual(
      ["user-lead"],
    );
  });
});

describe("isAssignedTo", () => {
  const shared = { technicianUserId: "user-lead", technicianUserIds: ["user-lead", "user-second"] };

  it("assigns a shared visit to the lead and to the second technician", () => {
    expect(isAssignedTo(shared, "user-lead")).toBe(true);
    expect(isAssignedTo(shared, "user-second")).toBe(true);
  });

  it("does not assign the visit to another technician", () => {
    expect(isAssignedTo(shared, "user-other")).toBe(false);
  });

  it("assigns a visit without list to its lead only", () => {
    const alone = { technicianUserId: "user-lead", technicianUserIds: [] };
    expect(isAssignedTo(alone, "user-lead")).toBe(true);
    expect(isAssignedTo(alone, "user-second")).toBe(false);
  });
});
