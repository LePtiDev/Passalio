import type { AdminAccessPolicy } from "../domain/admin-access";

export type AdminTwoFactorSetting = {
  readonly ADMIN_TWO_FACTOR_REQUIRED?: string | undefined;
};

export const adminAccessPolicyOf = (env: AdminTwoFactorSetting): AdminAccessPolicy => ({
  isTwoFactorRequired: env.ADMIN_TWO_FACTOR_REQUIRED !== "false",
});
