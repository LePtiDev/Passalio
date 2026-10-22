import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/api-client";
import { identityApi, type OrganizationChanges } from "../identity-api";

export const ORGANIZATION_QUERY_KEY = ["identity", "organization"] as const;

export const ORGANIZATION_LOGO_URL = "/api/organization/logo";

export const useOrganization = () =>
  useQuery({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: async () => unwrap(await identityApi.fetchOrganization()),
  });

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (changes: OrganizationChanges) =>
      unwrap(await identityApi.updateOrganization(changes)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY }),
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => unwrap(await identityApi.uploadLogo(file)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY }),
  });
};
