import { ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { inMemoryEquipment, seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { addEquipment } from "./add-equipment";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
const run = () => addEquipment(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");
const equipmentOf = (id: string) => state.equipments.find((equipment) => equipment.id === id);

beforeEach(() => {
  state = createInMemoryCustomerState();
  seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-b", "b");
});

describe("addEquipment", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s add an equipment", async (role) => {
    const result = await run()(organizationActorWith(role), {
      siteId: "site-a",
      equipment: { kind: "insert" },
    });
    expect(result.isOk).toBe(true);
  });

  it("stores an active equipment with its details, on the site, with the id chosen offline", async () => {
    const result = await run()(technician, {
      id: "equipment-new",
      siteId: "site-a",
      equipment: {
        kind: "boiler",
        energy: "gas",
        brand: "Saunier Duval",
        details: { boilerType: "condensing" },
        installationYear: 2015,
      },
    });
    expect(result.isOk && result.value).toMatchObject({
      id: "equipment-new",
      organizationId: "organization-a",
      siteId: "site-a",
      kind: "boiler",
      brand: "Saunier Duval",
      details: { boilerType: "condensing" },
      status: "active",
      isInstalledByUs: false,
      installationYear: 2015,
      removedOn: null,
      replacedByEquipmentId: null,
      nextDueDate: null,
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(equipmentOf("equipment-new")).toBeDefined();
  });

  it("replaces an equipment of the same site on the commissioning date of the new one", async () => {
    await run()(technician, {
      id: "equipment-new",
      siteId: "site-a",
      replacesEquipmentId: "equipment-a",
      equipment: { kind: "boiler", isInstalledByUs: true, commissionedOn: "2026-10-20" },
    });
    expect(equipmentOf("equipment-a")).toMatchObject({
      status: "removed",
      removedOn: "2026-10-20",
      replacedByEquipmentId: "equipment-new",
    });
  });

  it("replaces an equipment today in Paris when the new one has no commissioning date", async () => {
    await run()(technician, {
      id: "equipment-new",
      siteId: "site-a",
      replacesEquipmentId: "equipment-a",
      equipment: { kind: "boiler" },
    });
    expect(equipmentOf("equipment-a")?.removedOn).toBe("2026-10-23");
  });

  it("refuses to replace an equipment already removed", async () => {
    state.equipments.push(
      inMemoryEquipment({
        id: "equipment-removed",
        organizationId: "organization-a",
        siteId: "site-a",
        status: "removed",
        removedOn: "2025-01-01",
      }),
    );
    expect(
      await run()(technician, {
        siteId: "site-a",
        replacesEquipmentId: "equipment-removed",
        equipment: { kind: "boiler" },
      }),
    ).toEqual({ isOk: false, error: "equipment_already_removed" });
  });

  it("refuses to replace an equipment of another organization", async () => {
    expect(
      await run()(technician, {
        siteId: "site-a",
        replacesEquipmentId: "equipment-b",
        equipment: { kind: "boiler" },
      }),
    ).toEqual({ isOk: false, error: "equipment_not_found" });
    expect(equipmentOf("equipment-b")?.status).toBe("active");
  });

  it("refuses details that do not fit the kind", async () => {
    expect(
      await run()(technician, {
        siteId: "site-a",
        equipment: { kind: "boiler", details: { refrigerant: "R32" } },
      }),
    ).toEqual({ isOk: false, error: "invalid_equipment_details" });
  });

  it("refuses a kind that the company trades do not cover", async () => {
    expect(
      await run()(technician, { siteId: "site-a", equipment: { kind: "air_to_water_heat_pump" } }),
    ).toEqual({ isOk: false, error: "equipment_kind_not_offered" });
  });

  it("refuses to reuse an id already taken", async () => {
    expect(
      await run()(technician, {
        id: "equipment-b",
        siteId: "site-a",
        equipment: { kind: "boiler" },
      }),
    ).toEqual({ isOk: false, error: "already_exists" });
  });

  it("refuses a site of another organization", async () => {
    expect(await run()(technician, { siteId: "site-b", equipment: { kind: "boiler" } })).toEqual({
      isOk: false,
      error: "site_not_found",
    });
  });

  it("refuses a write during an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        siteId: "site-a",
        equipment: { kind: "boiler" },
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.equipments).toHaveLength(2);
  });
});
