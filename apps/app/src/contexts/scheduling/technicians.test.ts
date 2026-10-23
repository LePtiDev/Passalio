import { describe, expect, it } from "vitest";
import type { MemberRecord } from "@/lib/db/local-records";
import { TECHNICIAN_COLORS } from "./technician-colors";
import { selectedTechnicians, techniciansOf } from "./technicians";

const member = (userId: string, name: string): MemberRecord => ({
  userId,
  name,
  role: "technician",
});

const members = [
  member("user-zoe", "Zoé Martin"),
  member("user-self", "Quentin Guerrier"),
  member("user-alice", "Alice Durand"),
  member("user-elodie", "Élodie Bernard"),
];

const actor = { userId: "user-self", name: "Quentin Guerrier" };

describe("techniciansOf", () => {
  it("puts the current user first, in blue", () => {
    const [first] = techniciansOf(members, actor);
    expect(first?.userId).toBe("user-self");
    expect(first?.color).toBe(TECHNICIAN_COLORS[0]);
    expect(first?.color.bar).toBe("#3B82F6");
  });

  it("sorts the other technicians by name, ignoring accents and case", () => {
    expect(techniciansOf(members, actor).map(({ userId }) => userId)).toEqual([
      "user-self",
      "user-alice",
      "user-elodie",
      "user-zoe",
    ]);
  });

  it("gives each technician the next color in order", () => {
    expect(techniciansOf(members, actor).map(({ color }) => color)).toEqual(
      TECHNICIAN_COLORS.slice(0, 4),
    );
  });

  it("loops over the eight colors when the team is larger", () => {
    const team = Array.from({ length: 10 }, (_, index) =>
      member(`user-${index}`, `Technicien ${String(index).padStart(2, "0")}`),
    );
    const technicians = techniciansOf(team, { userId: "user-0", name: "Technicien 00" });
    expect(TECHNICIAN_COLORS).toHaveLength(8);
    expect(technicians[8]?.color).toBe(TECHNICIAN_COLORS[0]);
    expect(technicians[9]?.color).toBe(TECHNICIAN_COLORS[1]);
  });

  it("keeps the current user first even before the members are cached", () => {
    const technicians = techniciansOf([member("user-alice", "Alice Durand")], actor);
    expect(technicians.map(({ userId, name }) => ({ userId, name }))).toEqual([
      { userId: "user-self", name: "Quentin Guerrier" },
      { userId: "user-alice", name: "Alice Durand" },
    ]);
  });

  it("uses the first word of the name as first name", () => {
    const technicians = techniciansOf([member("user-self", "  Jean-Marc   Dupont ")], actor);
    expect(technicians[0]?.firstName).toBe("Jean-Marc");
  });

  it("lists the current user only once", () => {
    expect(
      techniciansOf(members, actor).filter(({ userId }) => userId === "user-self"),
    ).toHaveLength(1);
  });
});

describe("selectedTechnicians", () => {
  const technicians = techniciansOf(members, actor);

  it("shows every technician when nothing is selected", () => {
    expect(selectedTechnicians(technicians, undefined)).toEqual(technicians);
  });

  it("keeps only the selected agendas, in team order", () => {
    expect(
      selectedTechnicians(technicians, ["user-zoe", "user-self"]).map(({ userId }) => userId),
    ).toEqual(["user-self", "user-zoe"]);
  });

  it("ignores unknown technicians in the selection", () => {
    expect(selectedTechnicians(technicians, ["user-unknown"])).toEqual([]);
  });
});
