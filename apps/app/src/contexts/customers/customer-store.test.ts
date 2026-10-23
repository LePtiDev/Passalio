import type { SiteFields } from "@passalio/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import { createTestDatabase } from "@/lib/db/test-database";
import { customerFileOf, searchCustomers } from "./customer-queries";
import { archiveCustomer, createCustomer, updateCustomer } from "./customer-store";
import { addEquipment, addEquipmentPhoto, removeEquipment } from "./equipment-store";

const actor = { userId: "user-1", organizationId: "organization-a" };
const site: SiteFields = {
  address: "12 rue Paul Bert",
  postalCode: "94200",
  city: "Ivry-sur-Seine",
  buildingType: "house",
};

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("local customer store", () => {
  it("writes the customer, its site and two outbox entries in one go", async () => {
    const { customerId, siteId } = await createCustomer(database, actor, {
      customer: { kind: "individual", firstName: "Élodie", lastName: "Lefèvre" },
      site,
    });
    expect(await database.customers.get(customerId)).toMatchObject({
      searchName: "lefevre elodie",
      deletedAt: null,
    });
    expect((await database.sites.get(siteId ?? ""))?.customerId).toBe(customerId);
    const outbox = await database.outbox.orderBy("seq").toArray();
    expect(outbox.map(({ mutation }) => mutation.type)).toEqual(["create_customer", "add_site"]);
    expect(await searchCustomers(database, "LEF")).toHaveLength(1);
  });

  it("updates the search name and keeps untouched fields", async () => {
    const { customerId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Lefèvre", phone: "06 12 34 56 78" },
    });
    await updateCustomer(database, customerId, { lastName: "Durand", email: undefined });
    expect(await database.customers.get(customerId)).toMatchObject({
      lastName: "Durand",
      searchName: "durand",
      phone: "06 12 34 56 78",
    });
  });

  it("replaces an equipment and keeps the old one as removed", async () => {
    const { siteId } = await createCustomer(database, actor, {
      customer: { kind: "individual", lastName: "Lefèvre" },
      site,
    });
    const boilerId = await addEquipment(database, actor, {
      siteId: siteId ?? "",
      equipment: { kind: "boiler" },
    });
    const heatPumpId = await addEquipment(database, actor, {
      siteId: siteId ?? "",
      replacesEquipmentId: boilerId,
      equipment: { kind: "air_to_water_heat_pump", commissionedOn: "2026-10-20" },
    });
    expect(await database.equipments.get(boilerId)).toMatchObject({
      status: "removed",
      removedOn: "2026-10-20",
      replacedByEquipmentId: heatPumpId,
    });
    await removeEquipment(database, heatPumpId);
    expect((await database.equipments.get(heatPumpId))?.status).toBe("removed");
  });

  it("archives the customer with its sites, equipments and photos", async () => {
    const { customerId, siteId } = await createCustomer(database, actor, {
      customer: { kind: "company", companyName: "Boulangerie Martin" },
      site,
    });
    const equipmentId = await addEquipment(database, actor, {
      siteId: siteId ?? "",
      equipment: { kind: "insert" },
    });
    await addEquipmentPhoto(database, actor, {
      equipmentId,
      kind: "plate",
      blob: new Blob(["photo"], { type: "image/jpeg" }),
    });
    expect((await customerFileOf(database, customerId))?.photos).toHaveLength(1);
    await archiveCustomer(database, customerId);
    expect(await customerFileOf(database, customerId)).toBeUndefined();
    expect(await database.equipments.count()).toBe(0);
    expect(await database.photos.count()).toBe(0);
  });
});
