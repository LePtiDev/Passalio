import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectCompanyChanges,
  type Result,
} from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";
import { companySearchName, companySearchText, withChanges } from "../domain/prospect-rules";

export const updateCompany =
  ({ companies, people, now }: Pick<SalesDependencies, "companies" | "people" | "now">) =>
  async (
    actor: PlatformActor,
    companyId: string,
    changes: ProspectCompanyChanges,
  ): Promise<Result<null, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    const company = await companies.findById(companyId);
    if (company === undefined) {
      return err("company_not_found");
    }
    if (
      changes.ownerUserId !== undefined &&
      changes.ownerUserId !== null &&
      !(await people.isOwner(changes.ownerUserId))
    ) {
      return err("owner_not_found");
    }
    const merged = withChanges(company, changes);
    await companies.update(companyId, {
      ...changes,
      searchName: companySearchName(merged.name),
      searchText: companySearchText(merged),
      updatedAt: now(),
    });
    return ok(null);
  };
