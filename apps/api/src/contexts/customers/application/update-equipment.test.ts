import { ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { inMemoryEquipment, seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { updateEquipment } from "./update-equipment";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
const run = () => updateEquipment(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");
const equipmentOf = (id: string) => state.equipments.find((equipment) => equipment.id === id);

beforeEach(() => {
  state = createInMemoryCustomerState();
  seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-b", "b");
});

describe("updateEquipment", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s update an equipment", async (role) => {
    expect(
      await run()(organizationActorWith(role), {
        equipmentId: "equipment-a",
        changes: { brand: "Saunier Duval" },
      }),
    ).toEqual({ isOk: true, value: undefined });
    expect(equipmentOf("equipment-a")?.brand).toBe("Saunier Duval");
  });

  it("saves details that fit the equipment and dates the change", async () => {
    await run()(technician, {
      equipmentId: "equipment-a",
      changes: { details: { flueType: "lined_masonry", boilerType: "condensing" } },
    });
    expect(equipmentOf("equipment-a")).toMatchObject({
      kind: "boiler",
      energy: "gas",
      details: { flueType: "lined_masonry", boilerType: "condensing" },
      updatedAt: NOW,
    });
  });

  it("keeps the current details when only other fields change", async () => {
    state.equipments.splice(
      0,
      1,
      inMemoryEquipment({
        id: "equipment-a",
        organizationId: "organization-a",
        siteId: "site-a",
        details: { flueType: "metal" },
      }),
    );
    await run()(technician, { equipmentId: "equipment-a", changes: { room: "Cuisine" } });
    expect(equipmentOf("equipment-a")).toMatchObject({
      room: "Cuisine",
      details: { flueType: "metal" },
    });
  });

  it("rejects details that do not fit the equipment", async () => {
    expect(
      await run()(technician, {
        equipmentId: "equipment-a",
        changes: { details: { refrigerant: "R32" } },
      }),
    ).toEqual({ isOk: false, error: "invalid_equipment_details" });
    expect(equipmentOf("equipment-a")?.details).toEqual({});
  });

  it("refuses to change to a kind that the company trades do not cover", async () => {
    expect(
      await run()(technician, {
        equipmentId: "equipment-a",
        changes: { kind: "air_to_water_heat_pump", details: {} },
      }),
    ).toEqual({ isOk: false, error: "equipment_kind_not_offered" });
    expect(equipmentOf("equipment-a")?.kind).toBe("boiler");
  });

  it("changes to another kind that the company trades cover", async () => {
    expect(
      await run()(technician, {
        equipmentId: "equipment-a",
        changes: { kind: "insert", details: { flueType: "metal" } },
      }),
    ).toEqual({ isOk: true, value: undefined });
    expect(equipmentOf("equipment-a")).toMatchObject({
      kind: "insert",
      details: { flueType: "metal" },
    });
  });

  it("refuses a write during an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        equipmentId: "equipment-a",
        changes: { brand: "Saunier Duval" },
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(equipmentOf("equipment-a")?.brand).toBeNull();
  });

  it("does not reach an equipment of another organization", async () => {
    expect(
      await run()(technician, { equipmentId: "equipment-b", changes: { brand: "Saunier Duval" } }),
    ).toEqual({ isOk: false, error: "equipment_not_found" });
    expect(equipmentOf("equipment-b")?.brand).toBeNull();
  });
});
