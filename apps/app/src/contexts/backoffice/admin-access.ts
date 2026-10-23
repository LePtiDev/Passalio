import { PLATFORM_ROLE_PERMISSIONS, type PlatformRole } from "@passalio/shared";
import { backofficeApi, type PlatformAdmin } from "./backoffice-api";

type AdminDenial = "hidden" | "setup" | "code" | "unavailable";

export type AdminAccess =
  | { readonly status: "granted"; readonly admin: PlatformAdmin }
  | { readonly status: AdminDenial };

const DENIALS: ReadonlyMap<string, AdminDenial> = new Map<string, AdminDenial>([
  ["not_found", "hidden"],
  ["two_factor_required", "setup"],
  ["two_factor_unverified", "code"],
]);

export const loadAdminAccess = async (): Promise<AdminAccess> => {
  const result = await backofficeApi.fetchAdmin();
  if (result.isOk) {
    return { status: "granted", admin: result.value.admin };
  }
  return { status: DENIALS.get(result.error.code) ?? "unavailable" };
};

export const canSeePlatform = (role: PlatformRole) =>
  PLATFORM_ROLE_PERMISSIONS[role].has("platform:read");
