import { useInfiniteQuery } from "@tanstack/react-query";
import { unwrap } from "@/lib/api-client";
import { identityFr } from "../fr";
import { identityApi, type PendingInvitation } from "../identity-api";
import { TEAM_QUERY_KEY, useTeamMutation } from "./use-team";

export const PENDING_INVITATIONS_QUERY_KEY = [...TEAM_QUERY_KEY, "invitations"] as const;

type PageContext = {
  readonly pageParam: string | null;
};

export const usePendingInvitations = () =>
  useInfiniteQuery({
    queryKey: PENDING_INVITATIONS_QUERY_KEY,
    queryFn: async ({ pageParam }: PageContext) =>
      unwrap(await identityApi.fetchPendingInvitations(pageParam)),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

type InvitationTarget = Pick<PendingInvitation, "id" | "email">;

export const useResendInvitation = () =>
  useTeamMutation(
    ({ id }: InvitationTarget) => identityApi.resendInvitation(id),
    ({ email }) => identityFr.pendingInvitations.resent(email),
  );

export const useCancelInvitation = () =>
  useTeamMutation(
    ({ id }: InvitationTarget) => identityApi.cancelInvitation(id),
    ({ email }) => identityFr.pendingInvitations.canceled(email),
  );
