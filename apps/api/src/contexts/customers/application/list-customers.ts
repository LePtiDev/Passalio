import { assertCan, type Actor } from "@passalio/shared";
import type { CustomerSummary } from "../domain/customer-models";
import type { CustomerDependencies } from "../domain/customer-ports";
import { searchRange } from "../domain/customer-rules";

export const CUSTOMERS_PAGE_SIZE = 50;

const CURSOR_SEPARATOR = "|";

export type ListCustomersInput = {
  readonly query?: string | undefined;
  readonly cursor?: string | undefined;
};

export type CustomersPage = {
  readonly customers: readonly CustomerSummary[];
  readonly nextCursor: string | null;
};

const parseCursor = (cursor: string | undefined) => {
  if (cursor === undefined) {
    return undefined;
  }
  const separatorIndex = cursor.lastIndexOf(CURSOR_SEPARATOR);
  return separatorIndex === -1
    ? undefined
    : { searchName: cursor.slice(0, separatorIndex), id: cursor.slice(separatorIndex + 1) };
};

export const listCustomers =
  ({ customers }: Pick<CustomerDependencies, "customers">) =>
  async (actor: Actor, input: ListCustomersInput): Promise<CustomersPage> => {
    assertCan(actor, "customers:read");
    const after = parseCursor(input.cursor);
    const range = input.query === undefined ? undefined : searchRange(input.query);
    const page = await customers.list(actor.organizationId, {
      limit: CUSTOMERS_PAGE_SIZE + 1,
      ...(after === undefined ? {} : { after }),
      ...(range === undefined ? {} : { range }),
    });
    const visible = page.slice(0, CUSTOMERS_PAGE_SIZE);
    const last = visible.at(-1);
    return {
      customers: visible.map(({ searchName: _searchName, ...customer }) => customer),
      nextCursor:
        page.length > CUSTOMERS_PAGE_SIZE && last !== undefined
          ? `${last.searchName}${CURSOR_SEPARATOR}${last.id}`
          : null,
    };
  };
