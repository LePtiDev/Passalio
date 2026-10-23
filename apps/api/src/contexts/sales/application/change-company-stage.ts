import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectStage,
  type Result,
} from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";

export const changeCompanyStage =
  ({ companies, now, newId }: Pick<SalesDependencies, "companies" | "now" | "newId">) =>
  async (
    actor: PlatformActor,
    companyId: string,
    stage: ProspectStage,
  ): Promise<Result<null, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    const company = await companies.findById(companyId);
    if (company === undefined) {
      return err("company_not_found");
    }
    if (company.stage === stage) {
      return ok(null);
    }
    await companies.changeStage(companyId, stage, {
      id: newId(),
      companyId,
      contactId: null,
      authorUserId: actor.userId,
      kind: "stage_changed",
      body: null,
      fromStage: company.stage,
      toStage: stage,
      createdAt: now(),
    });
    return ok(null);
  };
