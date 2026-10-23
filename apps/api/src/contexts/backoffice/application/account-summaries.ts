import type { AccountSummaryResponse } from "@passalio/shared";
import { trialEndOf, type ActivityWindow } from "../domain/activity-window";
import type { AccountRow, BackofficeReadModel, MemberRow } from "../domain/backoffice-ports";
import { usageTrend } from "../domain/usage-trend";

const latestActivityOf = (members: readonly MemberRow[]) =>
  members.reduce<{ day: string; name: string } | null>(
    (latest, { lastActiveDay, name }) =>
      lastActiveDay !== null && (latest === null || lastActiveDay > latest.day)
        ? { day: lastActiveDay, name }
        : latest,
    null,
  );

export const summarizeAccounts = async (
  readModel: BackofficeReadModel,
  window: ActivityWindow,
  rows: readonly AccountRow[],
): Promise<AccountSummaryResponse[]> => {
  const organizationIds = rows.map(({ id }) => id);
  if (organizationIds.length === 0) {
    return [];
  }
  const [members, activity] = await Promise.all([
    readModel.membersOf(window, organizationIds),
    readModel.monthlyActivityOf(window, organizationIds),
  ]);
  return rows.map((row) => {
    const staff = members.filter(({ organizationId }) => organizationId === row.id);
    const trialEndsAt = trialEndOf(row.createdAt);
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      createdAt: row.createdAt.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
      isInTrial: row.createdAt > window.trialStartedAfter,
      staffCount: staff.length,
      staff: staff.map(({ name, role }) => ({ name, role })),
      monthlyActivity: window.months.map((month) => ({
        month,
        activeDays: activity
          .filter((entry) => entry.organizationId === row.id && entry.month === month)
          .reduce((total, entry) => total + entry.activeDays, 0),
      })),
      trend: usageTrend(row.recent, row.previous),
      lastActive: latestActivityOf(staff),
    };
  });
};
