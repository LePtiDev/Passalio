import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectCallLog,
  type ProspectCallLoggedResponse,
  type Result,
} from "@passalio/shared";
import type { ProspectTask } from "../domain/call-models";
import { isScheduledNextAction, notifyAtOf, stageAfterCall } from "../domain/call-rules";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";

export const logCall =
  ({
    companies,
    contacts,
    calls,
    now,
    newId,
  }: Pick<SalesDependencies, "companies" | "contacts" | "calls" | "now" | "newId">) =>
  async (
    actor: PlatformActor,
    companyId: string,
    input: ProspectCallLog,
  ): Promise<Result<ProspectCallLoggedResponse, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    const company = await companies.findById(companyId);
    if (company === undefined) {
      return err("company_not_found");
    }
    const contactId = input.contactId ?? null;
    if (contactId !== null && (await contacts.findById(contactId))?.companyId !== companyId) {
      return err("contact_not_in_company");
    }
    const calledAt = now();
    const nextAction = input.nextAction ?? null;
    const schedule = input.schedule ?? null;
    const task: ProspectTask | null =
      schedule === null || !isScheduledNextAction(nextAction)
        ? null
        : {
            id: newId(),
            companyId,
            contactId,
            ownerUserId: actor.userId,
            kind: nextAction,
            dueAt: new Date(schedule.dueAt),
            notify: schedule.notify,
            notifyAt: notifyAtOf(new Date(schedule.dueAt), schedule.notify),
            notifiedAt: null,
            status: "open",
            createdAt: calledAt,
            updatedAt: calledAt,
          };
    const callId = newId();
    await calls.record(
      {
        id: callId,
        companyId,
        contactId,
        authorUserId: actor.userId,
        outcome: input.outcome,
        nextAction,
        notes: input.notes ?? null,
        calledAt,
      },
      {
        companyId,
        lastCallAt: calledAt,
        lastCallOutcome: input.outcome,
        lastCallByUserId: actor.userId,
      },
      task,
    );
    const stage = stageAfterCall(company.stage, input.outcome, nextAction);
    if (stage !== company.stage) {
      await companies.changeStage(companyId, stage, {
        id: newId(),
        companyId,
        contactId,
        authorUserId: actor.userId,
        kind: "stage_changed",
        body: null,
        fromStage: company.stage,
        toStage: stage,
        createdAt: calledAt,
      });
    }
    return ok({ id: callId, taskId: task?.id ?? null, stage });
  };
