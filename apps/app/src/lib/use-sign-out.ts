import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { authClient } from "./auth-client";
import { deleteLocalDatabases } from "./db/local-database";
import { forgetOfflineSession } from "./offline-session";
import { forgetRememberedChecks } from "./remembered-check";
import { SIGN_IN_PATH } from "./session";

export const useSignOut = (returnTo?: string) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await authClient.signOut();
    queryClient.clear();
    forgetOfflineSession();
    forgetRememberedChecks();
    await deleteLocalDatabases();
    await navigate({
      to: SIGN_IN_PATH,
      search: returnTo === undefined ? {} : { retour: returnTo },
    });
  }, [navigate, queryClient, returnTo]);
};
