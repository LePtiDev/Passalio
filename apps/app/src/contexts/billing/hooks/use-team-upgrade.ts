import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiErrorOf, unwrap } from "@/lib/api-client";
import { toastApiError } from "@/lib/errors";
import { billingFr } from "../billing-fr";
import { billingApi } from "../billing-api";
import { SUBSCRIPTION_QUERY_KEY } from "./use-subscription";

export const TEAM_UPGRADE_PREVIEW_QUERY_KEY = ["billing", "team-upgrade-preview"] as const;

const PREVIEW_EXPIRED = "preview_expired";

export const useTeamUpgradePreview = () =>
  useQuery({
    queryKey: TEAM_UPGRADE_PREVIEW_QUERY_KEY,
    queryFn: async () => unwrap(await billingApi.previewTeamUpgrade()),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

export const useUpgradeToTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { showsErrorsInline: true },
    mutationFn: async (prorationDate: number) =>
      unwrap(await billingApi.upgradeToTeam({ prorationDate })),
    onSuccess: async () => {
      toast.success(billingFr.teamUpgrade.upgraded);
      await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
    },
    onError: async (error) => {
      const apiError = apiErrorOf(error);
      toastApiError(apiError);
      if (apiError.code === PREVIEW_EXPIRED) {
        await queryClient.invalidateQueries({ queryKey: TEAM_UPGRADE_PREVIEW_QUERY_KEY });
      }
    },
  });
};
