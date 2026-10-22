import type { Actor, OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { addEquipment } from "./add-equipment";
import { addSite } from "./add-site";
import { createCustomer } from "./create-customer";
import { getCustomerFile } from "./get-customer-file";
import { getEquipmentPhoto } from "./get-equipment-photo";
import { removeEquipment } from "./remove-equipment";
import { updateEquipment } from "./update-equipment";
import { uploadEquipmentPhoto } from "./upload-equipment-photo";

const ORGANIZATION_ID = "organization-a";
const NOW = new Date("2026-10-22T10:00:00Z");

let state: InMemoryCustomerState;
let customerId: string;
let siteId: string;
const dependencies = () => createInMemoryCustomerDependencies(state, () => NOW);

const actor = (role: OrganizationRole = "technician", organizationId = ORGANIZATION_ID): Actor => ({
  userId: `user-${role}`,
  organizationId,
  role,
  isImpersonating: false,
});

const addBoiler = async () => {
  const result = await addEquipment(dependencies())(actor(), {
    siteId,
    equipment: { kind: "boiler", energy: "gas", brand: "Saunier Duval" },
  });
  return result.isOk ? result.value.id : "";
};

beforeEach(async () => {
  state = createInMemoryCustomerState();
  state.trades.set(ORGANIZATION_ID, [
    "chimney_sweeping",
    "boiler_maintenance",
    "heat_pump_maintenance",
  ]);
  const created = await createCustomer(dependencies())(actor(), {
    customer: { kind: "individual", lastName: "Lefèvre" },
    site: { address: "12 rue Paul Bert", postalCode: "94200", city: "Ivry", buildingType: "house" },
  });
  customerId = created.isOk ? created.value.customer.id : "";
  siteId = created.isOk ? (created.value.site?.id ?? "") : "";
});

describe("addEquipment", () => {
  it("refuses a kind that the company trades do not cover", async () => {
    state.trades.set(ORGANIZATION_ID, ["chimney_sweeping"]);
    const result = await addEquipment(dependencies())(actor(), {
      siteId,
      equipment: { kind: "air_to_water_heat_pump" },
    });
    expect(result).toEqual({ isOk: false, error: "equipment_kind_not_offered" });
  });

  it("replaces an old boiler by a heat pump installed by the company", async () => {
    const boilerId = await addBoiler();
    const result = await addEquipment(dependencies())(actor(), {
      siteId,
      replacesEquipmentId: boilerId,
      equipment: {
        kind: "air_to_water_heat_pump",
        isInstalledByUs: true,
        commissionedOn: "2026-10-20",
        details: { refrigerant: "R32", refrigerantChargeKg: 1.4 },
      },
    });
    expect(result.isOk).toBe(true);
    const heatPumpId = result.isOk ? result.value.id : "";
    expect(state.equipments.find(({ id }) => id === boilerId)).toMatchObject({
      status: "removed",
      removedOn: "2026-10-20",
      replacedByEquipmentId: heatPumpId,
    });
  });

  it("does not replace an equipment from another site", async () => {
    const boilerId = await addBoiler();
    const other = await addSite(dependencies())(actor(), {
      customerId,
      site: {
        address: "3 rue Gambetta",
        postalCode: "94400",
        city: "Vitry",
        buildingType: "apartment",
      },
    });
    const result = await addEquipment(dependencies())(actor(), {
      siteId: other.isOk ? other.value.id : "",
      replacesEquipmentId: boilerId,
      equipment: { kind: "boiler" },
    });
    expect(result).toEqual({ isOk: false, error: "equipment_not_found" });
  });

  it("refuses a site of another organization", async () => {
    const result = await addEquipment(dependencies())(actor("owner", "organization-b"), {
      siteId,
      equipment: { kind: "boiler" },
    });
    expect(result).toEqual({ isOk: false, error: "site_not_found" });
  });
});

describe("updateEquipment and removeEquipment", () => {
  it("rejects details that do not fit the equipment", async () => {
    const boilerId = await addBoiler();
    const result = await updateEquipment(dependencies())(actor(), {
      equipmentId: boilerId,
      changes: { details: { refrigerant: "R32" } },
    });
    expect(result).toEqual({ isOk: false, error: "invalid_equipment_details" });
  });

  it("marks an equipment as removed once", async () => {
    const boilerId = await addBoiler();
    expect((await removeEquipment(dependencies())(actor(), { equipmentId: boilerId })).isOk).toBe(
      true,
    );
    expect(state.equipments[0]).toMatchObject({ status: "removed", removedOn: "2026-10-22" });
    expect(await removeEquipment(dependencies())(actor(), { equipmentId: boilerId })).toEqual({
      isOk: false,
      error: "equipment_already_removed",
    });
  });
});

describe("equipment photos", () => {
  it("stores a plate photo under the organization and lists it without its key", async () => {
    const equipmentId = await addBoiler();
    const uploaded = await uploadEquipmentPhoto(dependencies())(actor(), {
      equipmentId,
      kind: "plate",
      body: new ArrayBuffer(1024),
      contentType: "image/jpeg",
    });
    expect(uploaded.isOk).toBe(true);
    expect([...state.storedPhotos.keys()][0]).toMatch(
      /^organizations\/organization-a\/equipment-photos\//,
    );
    const file = await getCustomerFile(dependencies())(actor(), { customerId });
    expect(file.isOk && file.value.photos[0]).not.toHaveProperty("storageKey");
    const photoId = uploaded.isOk ? uploaded.value.id : "";
    expect((await getEquipmentPhoto(dependencies())(actor(), { photoId })).isOk).toBe(true);
    expect(
      await getEquipmentPhoto(dependencies())(actor("owner", "organization-b"), { photoId }),
    ).toEqual({
      isOk: false,
      error: "photo_not_found",
    });
  });

  it("refuses a file that is not an image", async () => {
    const equipmentId = await addBoiler();
    const result = await uploadEquipmentPhoto(dependencies())(actor(), {
      equipmentId,
      kind: "overview",
      body: new ArrayBuffer(10),
      contentType: "application/pdf",
    });
    expect(result).toEqual({ isOk: false, error: "invalid_photo" });
  });
});
