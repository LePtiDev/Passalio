import { normalizeSearchText } from "@passalio/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { useLocalSession } from "@/lib/db/local-database-context";
import type { CustomerRecord, EquipmentRecord, SiteRecord } from "@/lib/db/local-records";
import { pendingEntityIds } from "@/lib/db/outbox";
import { customerNameOf, dueStatusOf, nextDueOf, type DueStatus } from "../customer-view";

export type CustomerFilter = "all" | "near" | "overdue";

export type CustomerListRow = {
  readonly customer: CustomerRecord;
  readonly name: string;
  readonly site: SiteRecord | null;
  readonly equipments: readonly EquipmentRecord[];
  readonly nextDue: string | null;
  readonly dueStatus: DueStatus | null;
  readonly isPending: boolean;
  readonly searchText: string;
};

const groupBy = <T, K>(items: readonly T[], keyOf: (item: T) => K) =>
  items.reduce((groups, item) => {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
    return groups;
  }, new Map<K, T[]>());

const digitsOf = (value: string | null) => (value ?? "").replaceAll(/\D/g, "");

const NAME_ORDER = new Intl.Collator("fr-FR", { sensitivity: "base" });

const rowsOf = (
  customers: readonly CustomerRecord[],
  sites: readonly SiteRecord[],
  equipments: readonly EquipmentRecord[],
  pending: ReadonlySet<string>,
  today: Date,
): CustomerListRow[] => {
  const sitesByCustomer = groupBy(sites, ({ customerId }) => customerId);
  const equipmentsBySite = groupBy(
    equipments.filter(({ status }) => status === "active"),
    ({ siteId }) => siteId,
  );
  const rows = customers.map((customer) => {
    const customerSites = sitesByCustomer.get(customer.id) ?? [];
    const customerEquipments = customerSites.flatMap(({ id }) => equipmentsBySite.get(id) ?? []);
    const nextDue = nextDueOf(customerEquipments);
    const site =
      customerSites.toSorted((left, right) => left.createdAt.localeCompare(right.createdAt))[0] ??
      null;
    return {
      customer,
      name: customerNameOf(customer),
      site,
      equipments: customerEquipments,
      nextDue,
      dueStatus: nextDue === null ? null : dueStatusOf(nextDue, today),
      isPending: pending.has(customer.id),
      searchText: [
        customer.searchName,
        ...customerSites.map(({ city, postalCode }) =>
          normalizeSearchText(`${city} ${postalCode}`),
        ),
        digitsOf(customer.phone),
        digitsOf(customer.secondaryPhone),
      ].join(" "),
    };
  });
  return rows.toSorted((left, right) => NAME_ORDER.compare(left.name, right.name));
};

const matches = (row: CustomerListRow, query: string) => {
  const words = normalizeSearchText(query)
    .split(" ")
    .filter((word) => word !== "");
  const digits = digitsOf(query);
  return digits.length >= 4
    ? row.searchText.includes(digits)
    : words.every((word) => row.searchText.split(" ").some((part) => part.startsWith(word)));
};

export const useCustomerList = (query: string, filter: CustomerFilter) => {
  const { database } = useLocalSession();
  const data = useLiveQuery(async () => {
    const [customers, sites, equipments, pending] = await Promise.all([
      database.customers.orderBy("searchName").toArray(),
      database.sites.toArray(),
      database.equipments.toArray(),
      pendingEntityIds(database),
    ]);
    return {
      rows: rowsOf(customers, sites, equipments, pending, new Date()),
      equipmentCount: equipments.filter(({ status }) => status === "active").length,
    };
  }, [database]);
  return useMemo(() => {
    if (data === undefined) {
      return undefined;
    }
    const searched =
      query.trim() === "" ? data.rows : data.rows.filter((row) => matches(row, query));
    const counts = {
      all: searched.length,
      near: searched.filter(({ dueStatus }) => dueStatus === "near").length,
      overdue: searched.filter(({ dueStatus }) => dueStatus === "overdue").length,
    };
    return {
      rows: filter === "all" ? searched : searched.filter(({ dueStatus }) => dueStatus === filter),
      counts,
      customerCount: data.rows.length,
      equipmentCount: data.equipmentCount,
    };
  }, [data, query, filter]);
};
