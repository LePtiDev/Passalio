import { assertCan, type Actor } from "@passalio/shared";
import type { PendingInvitation } from "../domain/identity-models";
import type { IdentityDependencies } from "../domain/identity-ports";

export const INVITATIONS_PAGE_SIZE = 50;

export type ListPendingInvitationsInput = {
  readonly afterId?: string;
};

export type PendingInvitationsPage = {
  readonly invitations: readonly PendingInvitation[];
  readonly nextCursor: string | null;
};

export const listPendingInvitations =
  ({ invitations }: Pick<IdentityDependencies, "invitations">) =>
  async (actor: Actor, input: ListPendingInvitationsInput): Promise<PendingInvitationsPage> => {
    assertCan(actor, "members:read");
    const page = await invitations.listPending(actor.organizationId, {
      limit: INVITATIONS_PAGE_SIZE + 1,
      ...input,
    });
    const visible = page.slice(0, INVITATIONS_PAGE_SIZE);
    const last = visible.at(-1);
    return {
      invitations: visible,
      nextCursor: page.length > INVITATIONS_PAGE_SIZE && last !== undefined ? last.id : null,
    };
  };
