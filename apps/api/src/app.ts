import { Hono } from "hono";
import { identityRoutes, organizationRoutes } from "./contexts/identity";
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
  .route("/", identityRoutes.userRoutes)
  .route("/", organizationRoutes.companySearchRoutes)
  .route("/", identityRoutes.memberRoutes)
  .route("/", organizationRoutes.organizationSettingsRoutes);

export const app = createApp()
  .get("/health", (context) => context.json({ status: "ok" }))
  .route("/api", apiRoutes);
