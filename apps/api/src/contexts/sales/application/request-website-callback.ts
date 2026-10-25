import { err, ok, type PublicCallbackRequest, type Result } from "@passalio/shared";
import type { ProspectTask } from "../domain/call-models";
import { notifyAtOf } from "../domain/call-rules";
import type { ProspectCompany } from "../domain/prospect-models";
import type { SalesDependencies } from "../domain/prospect-ports";
import { websiteCallbackFr } from "../domain/website-callback-fr";
import type {
  AntiRobotCheck,
  Visitor,
  VisitorRateLimit,
  WebsiteCallbackError,
} from "../domain/website-callback-ports";
import {
  callbackDueAt,
  departmentOfPostalCode,
  spacedPhone,
} from "../domain/website-callback-rules";
import { newProspectCompany } from "./create-company";

export type WebsiteCallbackDependencies = Pick<
  SalesDependencies,
  "companies" | "events" | "tasks" | "now" | "newId"
> & {
  readonly antiRobot: AntiRobotCheck;
  readonly rateLimit: VisitorRateLimit;
};

const WEBSITE_CALLBACK_NOTIFY = "at_time";

export const requestWebsiteCallback =
  ({ companies, events, tasks, now, newId, antiRobot, rateLimit }: WebsiteCallbackDependencies) =>
  async (
    request: PublicCallbackRequest,
    visitor: Visitor,
  ): Promise<Result<{ readonly taskId: string }, WebsiteCallbackError>> => {
    const at = now();
    if (!(await rateLimit.isAllowed(visitor, at))) {
      return err("too_many_requests");
    }
    if (!(await antiRobot.isHuman(request.turnstileToken, visitor))) {
      return err("robot_suspected");
    }
    const phone = spacedPhone(request.phone);
    const known = await companies.findByPhone(phone);
    const company: ProspectCompany =
      known ??
      newProspectCompany(
        {
          name: request.company ?? request.firstName,
          phone,
          postalCode: request.postalCode,
          department: departmentOfPostalCode(request.postalCode),
        },
        { id: newId(), at },
      );
    if (known === undefined) {
      await companies.create(company);
    }
    const dueAt = callbackDueAt(request.slot, at);
    const task: ProspectTask = {
      id: newId(),
      companyId: company.id,
      contactId: null,
      ownerUserId: company.ownerUserId,
      kind: "callback",
      dueAt,
      notify: WEBSITE_CALLBACK_NOTIFY,
      notifyAt: notifyAtOf(dueAt, WEBSITE_CALLBACK_NOTIFY),
      notifiedAt: null,
      status: "open",
      createdAt: at,
      updatedAt: at,
    };
    await tasks.createFromWebsite(task);
    await events.add({
      id: newId(),
      companyId: company.id,
      contactId: null,
      authorUserId: null,
      kind: "note",
      body: websiteCallbackFr.note({ ...request, phone }),
      fromStage: null,
      toStage: null,
      createdAt: at,
    });
    return ok({ taskId: task.id });
  };
