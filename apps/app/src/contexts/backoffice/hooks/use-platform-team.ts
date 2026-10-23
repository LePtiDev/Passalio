import type { InviteTeammateBody, PlatformRole } from "@passalio/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unwrap, type ApiResult } from "@/lib/api-client";
import { teamApi } from "../team-api";
import { PLATFORM_ROLE_LABELS, teamFr } from "../team-fr";

const TEAM_KEY = ["backoffice", "team"] as const;

export const usePlatformTeam = () =>
  useQuery({ queryKey: TEAM_KEY, queryFn: async () => unwrap(await teamApi.fetchTeam()) });

type MutationOptions = { readonly showsErrorsInline?: boolean };

const useTeamMutation = <Input>(
  action: (input: Input) => Promise<ApiResult<unknown>>,
  successMessage: (input: Input) => string,
  { showsErrorsInline = false }: MutationOptions = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => unwrap(await action(input)),
    meta: { showsErrorsInline },
    onSuccess: async (_value, input) => {
      toast.success(successMessage(input));
      await queryClient.invalidateQueries({ queryKey: TEAM_KEY });
    },
  });
};

export type TeammateTarget = { readonly userId: string; readonly name: string };

export type InvitationTarget = { readonly invitationId: string; readonly email: string };

export const useInviteTeammate = () =>
  useTeamMutation(
    (body: InviteTeammateBody) => teamApi.invite(body),
    ({ email }) => teamFr.inviteDialog.sent(email),
    { showsErrorsInline: true },
  );

export const useResendTeamInvitation = () =>
  useTeamMutation(
    ({ invitationId }: InvitationTarget) => teamApi.resendInvitation(invitationId),
    ({ email }) => teamFr.resent(email),
  );

export const useCancelTeamInvitation = () =>
  useTeamMutation(
    ({ invitationId }: InvitationTarget) => teamApi.cancelInvitation(invitationId),
    ({ email }) => teamFr.canceled(email),
  );

export const useChangeTeammateRole = () =>
  useTeamMutation(
    ({ userId, role }: TeammateTarget & { readonly role: PlatformRole }) =>
      teamApi.changeRole(userId, role),
    ({ name, role }) => teamFr.roleDialog.changed(name, PLATFORM_ROLE_LABELS[role]),
  );

export const useRemoveTeammate = () =>
  useTeamMutation(
    ({ userId }: TeammateTarget) => teamApi.remove(userId),
    ({ name }) => teamFr.removeDialog.removed(name),
  );
