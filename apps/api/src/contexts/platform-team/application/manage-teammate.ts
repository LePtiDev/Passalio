import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type PlatformRole,
  type Result,
} from "@passalio/shared";
import type { TeamError } from "../domain/team-error";
import type { TeamDependencies } from "../domain/team-ports";
import { checkNotSelf } from "../domain/team-rules";

type TeammateChange = { readonly userId: string; readonly role: PlatformRole };

export const changeTeammateRole =
  ({ teammates, auditTrail }: Pick<TeamDependencies, "teammates" | "auditTrail">) =>
  async (
    actor: PlatformActor,
    change: TeammateChange,
  ): Promise<Result<PlatformRole, TeamError>> => {
    assertPlatformCan(actor, "team:manage");
    const target = checkNotSelf(actor.userId, change.userId);
    if (!target.isOk) {
      return target;
    }
    const currentRole = await teammates.findRole(change.userId);
    if (currentRole === undefined) {
      return err("teammate_not_found");
    }
    if (currentRole === change.role) {
      return ok(currentRole);
    }
    await teammates.changeRole(change.userId, change.role);
    await auditTrail.record({
      actorUserId: actor.userId,
      action: "platform.role_changed",
      targetType: "user",
      targetId: change.userId,
      data: { from: currentRole, to: change.role },
    });
    return ok(change.role);
  };

export const removeTeammate =
  ({ teammates, auditTrail }: Pick<TeamDependencies, "teammates" | "auditTrail">) =>
  async (actor: PlatformActor, userId: string): Promise<Result<void, TeamError>> => {
    assertPlatformCan(actor, "team:manage");
    const target = checkNotSelf(actor.userId, userId);
    if (!target.isOk) {
      return target;
    }
    const currentRole = await teammates.findRole(userId);
    if (currentRole === undefined) {
      return err("teammate_not_found");
    }
    await teammates.remove(userId);
    await auditTrail.record({
      actorUserId: actor.userId,
      action: "platform.role_revoked",
      targetType: "user",
      targetId: userId,
      data: { role: currentRole },
    });
    return ok(undefined);
  };
