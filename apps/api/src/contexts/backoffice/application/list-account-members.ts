import {
  assertPlatformCan,
  err,
  ok,
  type AccountMembersResponse,
  type PlatformActor,
  type Result,
} from "@passalio/shared";
import { activityWindow } from "../domain/activity-window";
import type { BackofficeDependencies } from "../domain/backoffice-ports";
import { usageTrend } from "../domain/usage-trend";

export const listAccountMembers =
  ({ readModel, now }: BackofficeDependencies) =>
  async (
    actor: PlatformActor,
    organizationId: string,
  ): Promise<Result<AccountMembersResponse, "account_not_found">> => {
    assertPlatformCan(actor, "platform:read");
    if ((await readModel.findAccount(organizationId)) === undefined) {
      return err("account_not_found");
    }
    const [members, invitations] = await Promise.all([
      readModel.membersOf(activityWindow(now()), [organizationId]),
      readModel.pendingInvitationsOf(organizationId),
    ]);
    return ok({
      members: members.map((member) => ({
        userId: member.userId,
        name: member.name,
        email: member.email,
        role: member.role,
        lastActiveDay: member.lastActiveDay,
        trend: usageTrend(member.recent, member.previous),
        isTwoFactorEnabled: member.isTwoFactorEnabled,
        isBlocked: member.isBlocked,
      })),
      invitations: invitations.map((invitation) => ({
        ...invitation,
        createdAt: invitation.createdAt.toISOString(),
      })),
    });
  };
