import type { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api-client";
import { SUBSCRIPTION_QUERY_KEY } from "./hooks/use-subscription";

export const refreshWhenWorkspaceBlocked = async (
  queryClient: QueryClient,
  error: ApiError,
): Promise<void> => {
  if (error.code === "workspace_blocked") {
    await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
  }
};
