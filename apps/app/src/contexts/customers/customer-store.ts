import {
  newId,
  searchNameOf,
  type CustomerChanges,
  type CustomerFields,
  type SiteChanges,
  type SiteFields,
} from "@passalio/shared";
import type { LocalDatabase } from "@/lib/db/local-database";
import { enqueue } from "@/lib/db/outbox";
import { requestSync } from "@/lib/sync/sync-scheduler";
import {
  definedChanges,
  localCustomer,
  localSite,
  type LocalActor,
} from "./local-customer-records";

const nowIso = () => new Date().toISOString();

export const createCustomer = async (
  database: LocalDatabase,
  actor: LocalActor,
  input: { readonly customer: CustomerFields; readonly site?: SiteFields | undefined },
) => {
  const at = nowIso();
  const customerId = newId();
  const siteId = input.site === undefined ? null : newId();
  await database.transaction(
    "rw",
    [database.customers, database.sites, database.outbox],
    async () => {
      await database.customers.add(
        localCustomer(input.customer, {
          id: customerId,
          organizationId: actor.organizationId,
          createdByUserId: actor.userId,
          at,
        }),
      );
      await enqueue(database, { type: "create_customer", customerId, customer: input.customer });
      if (input.site !== undefined && siteId !== null) {
        await database.sites.add(
          localSite(input.site, {
            id: siteId,
            organizationId: actor.organizationId,
            customerId,
            at,
          }),
        );
        await enqueue(database, { type: "add_site", siteId, customerId, site: input.site });
      }
    },
  );
  requestSync(database);
  return { customerId, siteId };
};

export const updateCustomer = async (
  database: LocalDatabase,
  customerId: string,
  changes: CustomerChanges,
) => {
  const at = nowIso();
  const { hasOptedOutOfReminders, ...fields } = changes;
  await database.transaction("rw", [database.customers, database.outbox], async () => {
    await database.customers
      .where("id")
      .equals(customerId)
      .modify((customer) => {
        Object.assign(customer, definedChanges(fields));
        customer.searchName = searchNameOf(customer);
        if (hasOptedOutOfReminders !== undefined) {
          customer.remindersOptedOutAt = hasOptedOutOfReminders
            ? (customer.remindersOptedOutAt ?? at)
            : null;
        }
        customer.updatedAt = at;
      });
    await enqueue(database, { type: "update_customer", customerId, changes });
  });
  requestSync(database);
};

export const archiveCustomer = async (database: LocalDatabase, customerId: string) => {
  await database.transaction(
    "rw",
    [database.customers, database.sites, database.equipments, database.photos, database.outbox],
    async () => {
      const siteIds = await database.sites.where("customerId").equals(customerId).primaryKeys();
      const equipmentIds = await database.equipments.where("siteId").anyOf(siteIds).primaryKeys();
      await database.photos.where("equipmentId").anyOf(equipmentIds).delete();
      await database.equipments.bulkDelete(equipmentIds);
      await database.sites.bulkDelete(siteIds);
      await database.customers.delete(customerId);
      await enqueue(database, { type: "archive_customer", customerId });
    },
  );
  requestSync(database);
};

export const addSite = async (
  database: LocalDatabase,
  actor: LocalActor,
  customerId: string,
  site: SiteFields,
) => {
  const siteId = newId();
  await database.transaction("rw", [database.sites, database.outbox], async () => {
    await database.sites.add(
      localSite(site, {
        id: siteId,
        organizationId: actor.organizationId,
        customerId,
        at: nowIso(),
      }),
    );
    await enqueue(database, { type: "add_site", siteId, customerId, site });
  });
  requestSync(database);
  return siteId;
};

export const updateSite = async (database: LocalDatabase, siteId: string, changes: SiteChanges) => {
  const at = nowIso();
  await database.transaction("rw", [database.sites, database.outbox], async () => {
    await database.sites
      .where("id")
      .equals(siteId)
      .modify((site) => {
        Object.assign(site, definedChanges(changes));
        site.updatedAt = at;
      });
    await enqueue(database, { type: "update_site", siteId, changes });
  });
  requestSync(database);
};
