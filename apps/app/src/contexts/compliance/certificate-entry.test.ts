import { describe, expect, it } from "vitest";
import { certificateEntryOf } from "./certificate-entry";

const visitOf = ({
  equipmentIds = ["a", "b"],
  signed = [],
  drafted = [],
}: {
  readonly equipmentIds?: readonly string[];
  readonly signed?: readonly string[];
  readonly drafted?: readonly string[];
}) => ({
  equipments: equipmentIds.map((id) => ({ id })),
  documents: signed.map((equipmentId) => ({ equipmentId })),
  drafts: new Map(drafted.map((id) => [id, {}])),
});

describe("certificateEntryOf", () => {
  it("opens the first equipment still to fill", () => {
    expect(certificateEntryOf(visitOf({ drafted: ["a"] }))).toStrictEqual({
      step: "form",
      equipmentId: "b",
    });
  });

  it("goes to the signatures once every equipment is filled", () => {
    expect(certificateEntryOf(visitOf({ drafted: ["a", "b"] }))).toStrictEqual({ step: "sign" });
    expect(certificateEntryOf(visitOf({ signed: ["a"], drafted: ["b"] }))).toStrictEqual({
      step: "sign",
    });
  });

  it("shows the signed certificates once every equipment is signed", () => {
    expect(certificateEntryOf(visitOf({ signed: ["a", "b"] }))).toStrictEqual({ step: "signed" });
  });

  it("offers nothing for a visit without equipment to sweep", () => {
    expect(certificateEntryOf(visitOf({ equipmentIds: [] }))).toBeNull();
  });
});
