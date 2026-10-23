import {
  assertPlatformCan,
  type PlatformActor,
  type ProspectFiltersResponse,
} from "@passalio/shared";
import type { SalesDependencies } from "../domain/prospect-ports";

export const getProspectFilters =
  ({ companies, contacts, people }: Pick<SalesDependencies, "companies" | "contacts" | "people">) =>
  async (actor: PlatformActor): Promise<ProspectFiltersResponse> => {
    assertPlatformCan(actor, "prospects:read");
    const [departments, owners, contactCounts] = await Promise.all([
      companies.departments(),
      people.owners(),
      contacts.counts(undefined),
    ]);
    return {
      departments: [...departments],
      owners: [...owners],
      totals: {
        companies: departments.reduce((total, { count }) => total + count, 0),
        contacts: contactCounts.all,
      },
    };
  };
