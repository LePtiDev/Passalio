import { Hono } from "hono";
import { backofficeRoutes } from "./contexts/backoffice";
import { customerRoutes, equipmentRoutes } from "./contexts/customers";
import { identityRoutes, organizationRoutes } from "./contexts/identity";
import { teamInvitationRoutes, teamRoutes } from "./contexts/platform-team";
import { prospectCompanyRoutes, prospectContactRoutes } from "./contexts/sales";
import { syncRoutes } from "./contexts/sync";
import type { AppEnv } from "./env";
import { authRoutes } from "./platform/auth-routes";
import { handleError } from "./platform/errors";
import { impersonationGuardMiddleware } from "./platform/impersonation-guard";
import { requestServicesMiddleware } from "./platform/request-services";
import { traceMiddleware } from "./platform/trace";

export const createApp = () => new Hono<AppEnv>().use(traceMiddleware).onError(handleError);

const apiRoutes = new Hono<AppEnv>()
  .use(requestServicesMiddleware)
  .use(impersonationGuardMiddleware)
  .route("/auth", authRoutes)
  .route("/admin/prospects", prospectCompanyRoutes)
  .route("/admin/prospects", prospectContactRoutes)
  .route("/admin/team", teamRoutes)
  .route("/admin", backofficeRoutes)
  .route("/team-invitations", teamInvitationRoutes)
  .route("/", identityRoutes.userRoutes)
  .route("/", organizationRoutes.companySearchRoutes)
  .route("/", identityRoutes.memberRoutes)
  .route("/", organizationRoutes.organizationSettingsRoutes)
  .route("/", customerRoutes)
  .route("/", equipmentRoutes)
  .route("/", syncRoutes);

export const app = createApp()
  .get("/health", (context) => context.json({ status: "ok" }))
  .route("/api", apiRoutes);
