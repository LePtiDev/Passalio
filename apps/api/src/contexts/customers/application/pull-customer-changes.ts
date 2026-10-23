import { assertCan, type Actor } from "@passalio/shared";
import type { ChangeCursor, ChangeFeed, CustomerDependencies } from "../domain/customer-ports";

export const CUSTOMER_SYNC_TABLES = ["customers", "sites", "equipments", "photos"] as const;

export type CustomerSyncTable = (typeof CUSTOMER_SYNC_TABLES)[number];

export type CustomerSyncCursors = Partial<Record<CustomerSyncTable, ChangeCursor>>;

export const SYNC_PAGE_SIZE = 200;

const pageOf = async <T extends { readonly id: string; readonly updatedAt: Date }>(
  rows: Promise<readonly T[]>,
  current: ChangeCursor | undefined,
) => {
  const fetched = await rows;
  const visible = fetched.slice(0, SYNC_PAGE_SIZE);
  const last = visible.at(-1);
  return {
    rows: visible,
    cursor: last === undefined ? current : { updatedAt: last.updatedAt, id: last.id },
    hasMore: fetched.length > SYNC_PAGE_SIZE,
  };
};

const changesOf = (feed: ChangeFeed, organizationId: string, cursors: CustomerSyncCursors) => {
  const limit = SYNC_PAGE_SIZE + 1;
  return Promise.all([
    pageOf(feed.customers(organizationId, cursors.customers, limit), cursors.customers),
    pageOf(feed.sites(organizationId, cursors.sites, limit), cursors.sites),
    pageOf(feed.equipments(organizationId, cursors.equipments, limit), cursors.equipments),
    pageOf(feed.photos(organizationId, cursors.photos, limit), cursors.photos),
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
