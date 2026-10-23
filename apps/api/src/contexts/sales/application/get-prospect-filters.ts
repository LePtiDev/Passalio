import {
  assertPlatformCan,
  type PlatformActor,
  type ProspectFiltersResponse,
} from "@passalio/shared";
import type { SalesDependencies } from "../domain/prospect-ports";

export const getProspectFilters =
  ({ companies, people }: Pick<SalesDependencies, "companies" | "people">) =>
  async (actor: PlatformActor): Promise<ProspectFiltersResponse> => {
    assertPlatformCan(actor, "prospects:read");
    const [departments, owners] = await Promise.all([companies.departments(), people.owners()]);
    return { departments: [...departments], owners: [...owners] };
  };
