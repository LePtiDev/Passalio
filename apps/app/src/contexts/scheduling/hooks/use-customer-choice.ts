import { useLiveQuery } from "dexie-react-hooks";
import { customerFileOf, searchCustomers } from "@/contexts/customers";
import { useLocalSession } from "@/lib/db/local-database-context";

export const useCustomerMatches = (query: string, isActive: boolean) => {
  const { database } = useLocalSession();
  return useLiveQuery(async () => {
    if (!isActive) {
      return [];
    }
    const customers = await searchCustomers(database, query);
    const sites = await database.sites
      .where("customerId")
      .anyOf(customers.map(({ id }) => id))
      .toArray();
    return customers.map((customer) => ({
      customer,
      site: sites.find(({ customerId }) => customerId === customer.id) ?? null,
    }));
  }, [database, query, isActive]);
};

export const useChosenCustomer = (customerId: string) => {
  const { database } = useLocalSession();
  return useLiveQuery(
    async () => (customerId === "" ? null : ((await customerFileOf(database, customerId)) ?? null)),
    [database, customerId],
  );
};

export type ChosenCustomer = NonNullable<ReturnType<typeof useChosenCustomer>>;
