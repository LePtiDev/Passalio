import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectQualification,
  type Result,
} from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";

export const updateQualification =
  ({ companies, followUps, now }: Pick<SalesDependencies, "companies" | "followUps" | "now">) =>
  async (
    actor: PlatformActor,
    companyId: string,
    qualification: ProspectQualification,
  ): Promise<Result<null, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    if ((await companies.findById(companyId)) === undefined) {
      return err("company_not_found");
    }
    await followUps.qualify(companyId, qualification, now());
    return ok(null);
  };
