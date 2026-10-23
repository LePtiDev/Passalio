import { assertCan, changePageOf, SYNC_PAGE_SIZE, type Actor } from "@passalio/shared";
import type { ChangeCursor, ChangeFeed, CustomerDependencies } from "../domain/customer-ports";

export { SYNC_PAGE_SIZE } from "@passalio/shared";

export const CUSTOMER_SYNC_TABLES = ["customers", "sites", "equipments", "photos"] as const;

export type CustomerSyncTable = (typeof CUSTOMER_SYNC_TABLES)[number];

export type CustomerSyncCursors = Partial<Record<CustomerSyncTable, ChangeCursor>>;

const changesOf = (feed: ChangeFeed, organizationId: string, cursors: CustomerSyncCursors) => {
  const limit = SYNC_PAGE_SIZE + 1;
  return Promise.all([
    changePageOf(feed.customers(organizationId, cursors.customers, limit), cursors.customers),
    changePageOf(feed.sites(organizationId, cursors.sites, limit), cursors.sites),
    changePageOf(feed.equipments(organizationId, cursors.equipments, limit), cursors.equipments),
    changePageOf(feed.photos(organizationId, cursors.photos, limit), cursors.photos),
  ]);
};

const cursorEntry = (
  table: CustomerSyncTable,
  cursor: ChangeCursor | undefined,
): CustomerSyncCursors => (cursor === undefined ? {} : { [table]: cursor });

export const pullCustomerChanges =
  ({ changes }: Pick<CustomerDependencies, "changes">) =>
  async (actor: Actor, cursors: CustomerSyncCursors) => {
    assertCan(actor, "customers:read");
    const [customers, sites, equipments, photos] = await changesOf(
      changes,
      actor.organizationId,
      cursors,
    );
    return {
      changes: {
        customers: customers.rows,
        sites: sites.rows,
        equipments: equipments.rows,
        photos: photos.rows.map(({ storageKey: _storageKey, ...photo }) => photo),
      },
      cursors: {
        ...cursorEntry("customers", customers.cursor),
        ...cursorEntry("sites", sites.cursor),
        ...cursorEntry("equipments", equipments.cursor),
        ...cursorEntry("photos", photos.cursor),
      },
      hasMore: [customers, sites, equipments, photos].some((page) => page.hasMore),
    };
  };
