import {
  assertPlatformCan,
  err,
  ok,
  type AccountFileResponse,
  type PlatformActor,
  type Result,
} from "@passalio/shared";
import { activityWindow, trialEndOf } from "../domain/activity-window";
import type { BackofficeDependencies } from "../domain/backoffice-ports";
import { usageTrend } from "../domain/usage-trend";

export const getAccountFile =
  ({ readModel, now }: BackofficeDependencies) =>
  async (
    actor: PlatformActor,
    organizationId: string,
  ): Promise<Result<AccountFileResponse, "account_not_found">> => {
    assertPlatformCan(actor, "platform:read");
    const account = await readModel.findAccount(organizationId);
    if (account === undefined) {
      return err("account_not_found");
    }
    const window = activityWindow(now());
    const members = await readModel.membersOf(window, [organizationId]);
    const owner = members.find(({ role }) => role === "owner");
    const sum = (pick: (member: (typeof members)[number]) => number) =>
      members.reduce((total, member) => total + pick(member), 0);
    return ok({
      account: {
        ...account,
        trades: [...account.trades],
        createdAt: account.createdAt.toISOString(),
        trialEndsAt: trialEndOf(account.createdAt).toISOString(),
        isInTrial: account.createdAt > window.trialStartedAfter,
      },
      owner: owner === undefined ? null : { name: owner.name, email: owner.email },
      staffCount: members.length,
      trend: usageTrend(
        sum(({ recent }) => recent),
        sum(({ previous }) => previous),
      ),
    });
  };
