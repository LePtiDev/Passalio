import { assertPlatformCan, err, ok, type PlatformActor, type Result } from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";

export const deleteCompany =
  ({ companies, audit }: Pick<SalesDependencies, "companies" | "audit">) =>
  async (actor: PlatformActor, companyId: string): Promise<Result<null, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    if ((await companies.findById(companyId)) === undefined) {
      return err("company_not_found");
    }
    await companies.delete(companyId);
    await audit.companyDeleted(actor.userId, companyId);
    return ok(null);
  };
