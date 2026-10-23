import { assertCan, type Actor } from "@passalio/shared";
import type { TeamMember } from "../domain/identity-models";
import type { IdentityDependencies } from "../domain/identity-ports";

export const MEMBERS_PAGE_SIZE = 50;

export type ListMembersInput = {
  readonly afterId?: string;
  readonly limit?: number;
};

export type MembersPage = {
  readonly members: readonly TeamMember[];
  readonly nextCursor: string | null;
};

export const listMembers =
  ({ members }: Pick<IdentityDependencies, "members">) =>
  async (actor: Actor, input: ListMembersInput): Promise<MembersPage> => {
    assertCan(actor, "members:read");
    const limit = input.limit ?? MEMBERS_PAGE_SIZE;
    const page = await members.list(actor.organizationId, {
      limit: limit + 1,
      ...(input.afterId === undefined ? {} : { afterId: input.afterId }),
    });
    const visible = page.slice(0, limit);
    const last = visible.at(-1);
    return {
      members: visible,
      nextCursor: page.length > limit && last !== undefined ? last.id : null,
    };
  };
