import { describe, expect, it } from "vitest";
import { changedFields } from "./changed-fields";

describe("changedFields", () => {
  it("keeps only the fields whose value changed", () => {
    expect(
      changedFields(
        { lastName: "Moreau", email: "a@exemple.fr", phone: "0611223344" },
        { lastName: "Moreau", email: "b@exemple.fr", phone: "0611223344" },
      ),
    ).toEqual({ email: "b@exemple.fr" });
  });

  it("keeps a field that was cleared", () => {
    expect(changedFields({ email: "a@exemple.fr" }, { email: null })).toEqual({ email: null });
  });

  it("treats a missing and a null value as the same", () => {
    expect(changedFields({}, { email: null })).toEqual({});
  });

  it("compares nested values by content", () => {
    expect(changedFields({ tags: ["a", "b"] }, { tags: ["a", "b"] })).toEqual({});
    expect(changedFields({ tags: ["a"] }, { tags: ["a", "b"] })).toEqual({ tags: ["a", "b"] });
  });

  it("returns nothing when nothing changed", () => {
    expect(changedFields({ lastName: "Moreau" }, { lastName: "Moreau" })).toEqual({});
  });
});
