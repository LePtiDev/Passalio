import { assertPlatformCan, type PlatformActor } from "@passalio/shared";
import type { TeamPage } from "../domain/team-models";
import type { TeamDependencies } from "../domain/team-ports";

export const listTeam =
  ({ teammates, invitations }: Pick<TeamDependencies, "teammates" | "invitations">) =>
  async (actor: PlatformActor): Promise<TeamPage> => {
    assertPlatformCan(actor, "team:manage");
    const [members, pending] = await Promise.all([teammates.list(), invitations.listPending()]);
    return { members, invitations: pending };
  };
