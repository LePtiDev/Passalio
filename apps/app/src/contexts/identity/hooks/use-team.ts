import type { OrganizationRole } from "@passalio/shared";
import {
  keepPreviousData,
  skipToken,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { unwrap, type ApiResult } from "@/lib/api-client";
import { identityFr, ROLE_LABELS } from "../fr";
import { identityApi } from "../identity-api";
import { ACTOR_QUERY_KEY } from "./use-actor";

export const TEAM_QUERY_KEY = ["identity", "team"] as const;

type PageContext = {
  readonly pageParam: string | null;
};

export const useTeam = () =>
  useInfiniteQuery({
    queryKey: TEAM_QUERY_KEY,
    queryFn: async ({ pageParam }: PageContext) =>
      unwrap(await identityApi.fetchMembers(pageParam)),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

export const useTeamPage = (cursor: string | null, limit: number | null) =>
  useQuery({
    queryKey: [...TEAM_QUERY_KEY, "page", cursor, limit],
    queryFn:
      limit === null
        ? skipToken
        : async () => unwrap(await identityApi.fetchMembers(cursor, limit)),
    placeholderData: keepPreviousData,
  });

export const useTeamMutation = <Input>(
  action: (input: Input) => Promise<ApiResult<unknown>>,
  successMessage: (input: Input) => string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => unwrap(await action(input)),
    onSuccess: async (_value, input) => {
      toast.success(successMessage(input));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ACTOR_QUERY_KEY }),
      ]);
    },
  });
};

export type MemberTarget = {
  readonly memberId: string;
  readonly name: string;
};

export type RoleChange = MemberTarget & {
  readonly role: OrganizationRole;
};

export type InvitationRequest = {
  readonly email: string;
  readonly role: OrganizationRole;
};

export const useChangeRole = () =>
  useTeamMutation(
    ({ memberId, role }: RoleChange) => identityApi.changeMemberRole(memberId, role),
    ({ name, role }) => identityFr.team.roleChanged(name, ROLE_LABELS[role]),
  );

export const useRemoveMember = () =>
  useTeamMutation(
    ({ memberId }: MemberTarget) => identityApi.removeMember(memberId),
    ({ name }) => identityFr.team.removed(name),
  );

export const useTransferOwnership = () =>
  useTeamMutation(
    ({ memberId }: MemberTarget) => identityApi.transferOwnership(memberId),
    ({ name }) => identityFr.team.transferred(name),
  );

export const useInviteMember = () =>
  useTeamMutation(
    ({ email, role }: InvitationRequest) => identityApi.inviteMember(email, role),
    ({ email }) => identityFr.invite.sent(email),
  );
