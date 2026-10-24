import {
  assertPlatformCan,
  type PlatformActor,
  type ProspectMyDayResponse,
} from "@passalio/shared";
import { startOfNextParisDay, startOfParisDay } from "../domain/call-rules";
import type { SalesDependencies } from "../domain/prospect-ports";
import { taskResponse } from "./call-serializers";

export const MY_DAY_TASKS_LIMIT = 100;

export const getMyDay =
  ({ calls, tasks, now }: Pick<SalesDependencies, "calls" | "tasks" | "now">) =>
  async (actor: PlatformActor): Promise<ProspectMyDayResponse> => {
    assertPlatformCan(actor, "prospects:read");
    const at = now();
    const endOfDay = startOfNextParisDay(at);
    const [ownTasks, unownedTasks, callsToday] = await Promise.all([
      tasks.openOfOwnerDueBefore(actor.userId, endOfDay, MY_DAY_TASKS_LIMIT),
      tasks.openUnownedDueBefore(endOfDay, MY_DAY_TASKS_LIMIT),
      calls.countByAuthorSince(actor.userId, startOfParisDay(at)),
    ]);
    const dueTasks = [...ownTasks, ...unownedTasks]
      .toSorted(
        (first, second) =>
          first.dueAt.getTime() - second.dueAt.getTime() || first.id.localeCompare(second.id),
      )
      .slice(0, MY_DAY_TASKS_LIMIT);
    const overdue = dueTasks.filter(({ dueAt }) => dueAt < at).length;
    return {
      tasks: dueTasks.map(taskResponse),
      counts: { overdue, today: dueTasks.length - overdue, callsToday },
    };
  };
