import type { SiteFields } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addSite,
  archiveCustomer,
  createCustomer,
  updateCustomer,
  updateSite,
} from "@/contexts/customers/customer-store";
import {
  addEquipment,
  addEquipmentPhoto,
  removeEquipment,
  updateEquipment,
} from "@/contexts/customers/equipment-store";
import type { LocalDatabase } from "./local-database";
import { pendingEntityIds } from "./outbox";
import { createTestDatabase } from "./test-database";

const actor = { userId: "user-1", organizationId: "organization-a" };
const site: SiteFields = {
  address: "12 rue Paul Bert",
  postalCode: "94200",
  city: "Ivry-sur-Seine",
  buildingType: "house",
};

let database: LocalDatabase;

const refuseOutboxWrites = () => {
  database.outbox.hook("creating", () => {
    throw new Error("outbox unavailable");
  });
};

const refusePendingPhotoWrites = () => {
  database.pendingPhotos.hook("creating", () => {
    throw new Error("pending photos unavailable");
  });
};

const seedCustomerWithEquipment = async () => {
  const { customerId, siteId } = await createCustomer(database, actor, {
    customer: { kind: "individual", lastName: "Lefèvre" },
    site,
  });
  const equipmentId = await addEquipment(database, actor, {
    siteId: siteId ?? "",
    equipment: { kind: "boiler" },
  });
  await database.outbox.clear();
  return { customerId, siteId: siteId ?? "", equipmentId };
};

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("outbox written in the same transaction as the record", () => {
  it("does not keep a created customer when its outbox entry cannot be written", async () => {
    refuseOutboxWrites();
    await expect(
      createCustomer(database, actor, {
        customer: { kind: "individual", lastName: "Lefèvre" },
        site,
      }),
    ).rejects.toThrow("outbox unavailable");
    expect(await database.customers.count()).toBe(0);
    expect(await database.sites.count()).toBe(0);
    expect(await database.outbox.count()).toBe(0);
  });

  it("does not keep a customer change when its outbox entry cannot be written", async () => {
    const { customerId } = await seedCustomerWithEquipment();
    refuseOutboxWrites();
    await expect(updateCustomer(database, customerId, { lastName: "Martin" })).rejects.toThrow(
      "outbox unavailable",
    );
    expect((await database.customers.get(customerId))?.lastName).toBe("Lefèvre");
  });

  it("does not archive a customer locally when its outbox entry cannot be written", async () => {
    const { customerId, siteId, equipmentId } = await seedCustomerWithEquipment();
    refuseOutboxWrites();
    await expect(archiveCustomer(database, customerId)).rejects.toThrow("outbox unavailable");
    expect(await database.customers.get(customerId)).toBeDefined();
    expect(await database.sites.get(siteId)).toBeDefined();
    expect(await database.equipments.get(equipmentId)).toBeDefined();
  });

  it("does not keep a new site or a site change when the outbox entry cannot be written", async () => {
    const { customerId, siteId } = await seedCustomerWithEquipment();
    refuseOutboxWrites();
    await expect(addSite(database, actor, customerId, site)).rejects.toThrow("outbox unavailable");
    await expect(updateSite(database, siteId, { city: "Vitry-sur-Seine" })).rejects.toThrow(
      "outbox unavailable",
    );
    expect(await database.sites.count()).toBe(1);
    expect((await database.sites.get(siteId))?.city).toBe("Ivry-sur-Seine");
  });

  it("does not keep a new, changed or removed equipment when the outbox entry cannot be written", async () => {
    const { siteId, equipmentId } = await seedCustomerWithEquipment();
    refuseOutboxWrites();
    await expect(
      addEquipment(database, actor, {
        siteId,
        equipment: { kind: "air_to_water_heat_pump" },
        replacesEquipmentId: equipmentId,
      }),
    ).rejects.toThrow("outbox unavailable");
    await expect(updateEquipment(database, equipmentId, { brand: "Supra" })).rejects.toThrow(
      "outbox unavailable",
    );
    await expect(removeEquipment(database, equipmentId)).rejects.toThrow("outbox unavailable");
    expect(await database.equipments.count()).toBe(1);
    expect(await database.equipments.get(equipmentId)).toMatchObject({
      status: "active",
      brand: null,
      removedOn: null,
      replacedByEquipmentId: null,
    });
  });

  it("does not keep a photo when its upload cannot be queued", async () => {
    const { equipmentId } = await seedCustomerWithEquipment();
    refusePendingPhotoWrites();
    await expect(
      addEquipmentPhoto(database, actor, {
        equipmentId,
        kind: "plate",
        blob: new Blob(["photo"], { type: "image/jpeg" }),
      }),
    ).rejects.toThrow("pending photos unavailable");
    expect(await database.photos.count()).toBe(0);
  });
});

describe("outbox order", () => {
  it("keeps local changes in the order they were made", async () => {
    const { customerId, siteId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Lefèvre" },
      site,
    });
    await updateCustomer(database, customerId, { phone: "0600000000" });
    const equipmentId = await addEquipment(database, actor, {
      siteId: siteId ?? "",
      equipment: { kind: "boiler" },
    });
    await updateSite(database, siteId ?? "", { city: "Vitry-sur-Seine" });
    await removeEquipment(database, equipmentId);
    await archiveCustomer(database, customerId);
    const outbox = await database.outbox.orderBy("seq").toArray();
    expect(outbox.map(({ mutation }) => mutation.type)).toEqual([
      "create_customer",
      "add_site",
      "update_customer",
      "add_equipment",
      "update_site",
      "remove_equipment",
      "archive_customer",
    ]);
    expect(new Set(outbox.map(({ id }) => id)).size).toBe(outbox.length);
  });

  it("lists every record that still has a change waiting", async () => {
    const { customerId, siteId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Lefèvre" },
      site,
    });
    const equipmentId = await addEquipment(database, actor, {
      siteId: siteId ?? "",
      equipment: { kind: "boiler" },
    });
    expect([...(await pendingEntityIds(database))].toSorted()).toEqual(
      [customerId, siteId ?? "", equipmentId].toSorted(),
    );
  });
});
