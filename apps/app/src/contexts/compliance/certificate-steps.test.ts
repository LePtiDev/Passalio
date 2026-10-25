import { describe, expect, it } from "vitest";
import { isEquipmentSigned, nextEquipmentIdOf, unsignedEquipmentsOf } from "./certificate-steps";

const visitOf = ({
  signed = [],
  drafted = [],
}: {
  readonly signed?: readonly string[];
  readonly drafted?: readonly string[];
}) => ({
  equipments: [{ id: "a" }, { id: "b" }, { id: "c" }],
  documents: signed.map((equipmentId) => ({ equipmentId })),
  drafts: new Map(drafted.map((id) => [id, { flueDesignation: "Conduit" }])),
});

describe("nextEquipmentIdOf", () => {
  it("goes to the next equipment still to fill", () => {
    expect(nextEquipmentIdOf(visitOf({}), "a")).toBe("b");
  });

  it("skips equipments already signed or already filled", () => {
    expect(nextEquipmentIdOf(visitOf({ signed: ["b"], drafted: ["c"] }), "a")).toBeNull();
    expect(nextEquipmentIdOf(visitOf({ signed: ["b"] }), "a")).toBe("c");
  });

  it("comes back to an earlier equipment left empty", () => {
    expect(nextEquipmentIdOf(visitOf({ drafted: ["b"] }), "c")).toBe("a");
  });

  it("never returns the equipment being filled", () => {
    expect(nextEquipmentIdOf({ ...visitOf({}), equipments: [{ id: "a" }] }, "a")).toBeNull();
  });
});

describe("unsignedEquipmentsOf", () => {
  it("keeps only the equipments without a signed certificate", () => {
    const visit = visitOf({ signed: ["a", "c"] });
    expect(unsignedEquipmentsOf(visit)).toStrictEqual([{ id: "b" }]);
    expect(isEquipmentSigned(visit, "a")).toBe(true);
    expect(isEquipmentSigned(visit, "b")).toBe(false);
  });
});
