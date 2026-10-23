import {
  assertPlatformCan,
  err,
  ok,
  type AccountUsageResponse,
  type PlatformActor,
  type Result,
} from "@passalio/shared";
import { activityWindow } from "../domain/activity-window";
import type { BackofficeDependencies, MonthlyActivityRow } from "../domain/backoffice-ports";
import { usageTrend } from "../domain/usage-trend";

const monthsOf = (
  months: readonly string[],
  activity: readonly MonthlyActivityRow[],
  isIncluded: (entry: MonthlyActivityRow) => boolean,
) =>
  months.map((month) => ({
    month,
    activeDays: activity
      .filter((entry) => entry.month === month && isIncluded(entry))
      .reduce((total, entry) => total + entry.activeDays, 0),
  }));

export const getAccountUsage =
  ({ readModel, now }: BackofficeDependencies) =>
  async (
    actor: PlatformActor,
    organizationId: string,
  ): Promise<Result<AccountUsageResponse, "account_not_found">> => {
    assertPlatformCan(actor, "platform:read");
    if ((await readModel.findAccount(organizationId)) === undefined) {
      return err("account_not_found");
    }
    const window = activityWindow(now());
    const [members, activity] = await Promise.all([
      readModel.membersOf(window, [organizationId]),
      readModel.monthlyActivityOf(window, [organizationId]),
    ]);
    const total = (pick: (member: (typeof members)[number]) => number) =>
      members.reduce((sum, member) => sum + pick(member), 0);
    return ok({
      months: monthsOf(window.months, activity, () => true),
      trend: usageTrend(
        total(({ recent }) => recent),
        total(({ previous }) => previous),
      ),
      people: members.map((member) => ({
        userId: member.userId,
        name: member.name,
        role: member.role,
        months: monthsOf(window.months, activity, ({ userId }) => userId === member.userId),
        trend: usageTrend(member.recent, member.previous),
      })),
    });
  };
