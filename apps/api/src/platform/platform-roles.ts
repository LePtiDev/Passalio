import { adminAc, defaultAc, userAc } from "better-auth/plugins/admin/access";

export const PLATFORM_ROLES = {
  user: userAc,
  superadmin: adminAc,
  sales: userAc,
  admin: defaultAc.newRole({ user: ["list", "get", "impersonate"], session: ["list"] }),
};
