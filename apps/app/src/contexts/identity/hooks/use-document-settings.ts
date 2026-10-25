import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/api-client";
import { documentSettingsApi, type SettingsChanges } from "../document-settings-api";
import { ORGANIZATION_QUERY_KEY } from "./use-organization";

export const DOCUMENT_SETTINGS_QUERY_KEY = ["identity", "document-settings"] as const;

export const useDocumentSettings = () =>
  useQuery({
    queryKey: DOCUMENT_SETTINGS_QUERY_KEY,
    queryFn: async () => unwrap(await documentSettingsApi.fetchSettings()),
  });

const useRefreshSettings = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: DOCUMENT_SETTINGS_QUERY_KEY }),
    ]);
};

export const useUpdateSettings = () => {
  const refresh = useRefreshSettings();
  return useMutation({
    meta: { showsErrorsInline: true },
    mutationFn: async (changes: SettingsChanges) =>
      unwrap(await documentSettingsApi.updateSettings(changes)),
    onSuccess: refresh,
  });
};

export const useRemoveLogo = () => {
  const refresh = useRefreshSettings();
  return useMutation({
    mutationFn: async () => unwrap(await documentSettingsApi.removeLogo()),
    onSuccess: refresh,
  });
};
