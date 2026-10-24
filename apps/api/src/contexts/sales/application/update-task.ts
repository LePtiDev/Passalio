import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectTaskChange,
  type Result,
} from "@passalio/shared";
import { notifyAtOf } from "../domain/call-rules";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";

export const updateTask =
  ({ tasks, now }: Pick<SalesDependencies, "tasks" | "now">) =>
  async (
    actor: PlatformActor,
    taskId: string,
    change: ProspectTaskChange,
  ): Promise<Result<null, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    const task = await tasks.findById(taskId);
    if (task === undefined) {
      return err("task_not_found");
    }
    if (task.status !== "open") {
      return err("task_closed");
    }
    const schedule = change.schedule;
    await tasks.update(taskId, {
      status: change.status,
      ...(schedule === undefined
        ? {}
        : {
            dueAt: new Date(schedule.dueAt),
            notify: schedule.notify,
            notifyAt: notifyAtOf(new Date(schedule.dueAt), schedule.notify),
            notifiedAt: null,
          }),
      updatedAt: now(),
    });
    return ok(null);
  };
