import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/api-client";
import { logoForPdf } from "@/lib/pdf/logo-for-pdf";
import { identityApi, type OrganizationChanges } from "../identity-api";

export const ORGANIZATION_QUERY_KEY = ["identity", "organization"] as const;

export const ORGANIZATION_LOGO_URL = "/api/organization/logo";

export const useOrganization = () =>
  useQuery({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: async () => unwrap(await identityApi.fetchOrganization()),
  });

export const useOrganizationPdfLogo = (hasLogo: boolean) =>
  useQuery({
    queryKey: [...ORGANIZATION_QUERY_KEY, "pdf-logo"],
    enabled: hasLogo,
    queryFn: async () => {
      const response = await fetch(ORGANIZATION_LOGO_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("logo_unavailable");
      }
      return logoForPdf(await response.blob());
    },
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
