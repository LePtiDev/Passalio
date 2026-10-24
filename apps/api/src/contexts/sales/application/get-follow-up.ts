import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectFollowUpResponse,
  type Result,
} from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";
import { callResponse, qualificationResponse, taskResponse } from "./call-serializers";

export const CALL_HISTORY_LIMIT = 20;

export const getFollowUp =
  ({
    companies,
    followUps,
    calls,
    tasks,
  }: Pick<SalesDependencies, "companies" | "followUps" | "calls" | "tasks">) =>
  async (
    actor: PlatformActor,
    companyId: string,
  ): Promise<Result<ProspectFollowUpResponse, ProspectError>> => {
    assertPlatformCan(actor, "prospects:read");
    const [company, followUp, history, openTasks] = await Promise.all([
      companies.findById(companyId),
      followUps.findByCompany(companyId),
      calls.ofCompany(companyId, CALL_HISTORY_LIMIT),
      tasks.openOfCompany(companyId),
    ]);
    if (company === undefined) {
      return err("company_not_found");
    }
    const [lastCall] = history;
    return ok({
      qualification: qualificationResponse(followUp),
      lastCall:
        lastCall === undefined
          ? null
          : { at: lastCall.calledAt.toISOString(), outcome: lastCall.outcome, by: lastCall.author },
      calls: history.map(callResponse),
      tasks: openTasks.map(taskResponse),
    });
  };
