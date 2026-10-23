import { ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { removeEquipment } from "./remove-equipment";

let state: InMemoryCustomerState;
let now: Date;
const run = () => removeEquipment(createInMemoryCustomerDependencies(state, () => now));
const technician = organizationActorWith("technician");
const equipmentOf = (id: string) => state.equipments.find((equipment) => equipment.id === id);

beforeEach(() => {
  state = createInMemoryCustomerState();
  now = new Date("2026-10-23T10:00:00Z");
  seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-b", "b");
});

describe("removeEquipment", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s remove an equipment", async (role) => {
    expect(await run()(organizationActorWith(role), { equipmentId: "equipment-a" })).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(equipmentOf("equipment-a")?.status).toBe("removed");
  });

  it("keeps the removed equipment for the history with the given removal date", async () => {
    await run()(technician, { equipmentId: "equipment-a", removedOn: "2026-09-30" });
    expect(equipmentOf("equipment-a")).toMatchObject({
      status: "removed",
      removedOn: "2026-09-30",
      updatedAt: now,
    });
  });

  it("dates the removal of today in Paris when no date is given", async () => {
    now = new Date("2026-10-23T22:30:00Z");
    await run()(technician, { equipmentId: "equipment-a" });
    expect(equipmentOf("equipment-a")?.removedOn).toBe("2026-10-24");
  });

  it("refuses to remove an equipment twice", async () => {
    await run()(technician, { equipmentId: "equipment-a", removedOn: "2026-09-30" });
    expect(await run()(technician, { equipmentId: "equipment-a" })).toEqual({
      isOk: false,
      error: "equipment_already_removed",
    });
    expect(equipmentOf("equipment-a")?.removedOn).toBe("2026-09-30");
  });

  it("refuses a write during an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        equipmentId: "equipment-a",
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(equipmentOf("equipment-a")?.status).toBe("active");
  });

  it("does not reach an equipment of another organization", async () => {
    expect(await run()(technician, { equipmentId: "equipment-b" })).toEqual({
      isOk: false,
      error: "equipment_not_found",
    });
    expect(equipmentOf("equipment-b")?.status).toBe("active");
  });

  it("answers not found for an unknown equipment", async () => {
    expect(await run()(technician, { equipmentId: "equipment-unknown" })).toEqual({
      isOk: false,
      error: "equipment_not_found",
    });
  });
});

describe("removeEquipment of an archived customer", () => {
  it("answers not found for an equipment of an archived customer and keeps it as it was", async () => {
    await createInMemoryCustomerDependencies(state).customers.archive(
      "organization-a",
      "customer-a",
      now,
    );
    expect(await run()(technician, { equipmentId: "equipment-a" })).toEqual({
      isOk: false,
      error: "equipment_not_found",
    });
    expect(equipmentOf("equipment-a")).toMatchObject({ status: "active", removedOn: null });
  });
});
