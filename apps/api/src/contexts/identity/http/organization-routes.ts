import { LOGO_MAX_BYTES } from "@passalio/shared";
import { Hono } from "hono";
import { validateJson, validateQuery } from "../../../platform/validation";
import { completeOnboarding } from "../application/complete-onboarding";
import { getOrganizationLogo } from "../application/get-organization-logo";
import { getOrganizationProfile } from "../application/get-organization-profile";
import { removeOrganizationLogo } from "../application/remove-organization-logo";
import { searchCompanies } from "../application/search-companies";
import { updateOrganizationProfile } from "../application/update-organization-profile";
import { uploadOrganizationLogo } from "../application/upload-organization-logo";
import { identityDependencies } from "./identity-context";
import { identityErrorResponse } from "./identity-responses";
import { companySearchQuery, updateOrganizationBody } from "./identity-schemas";
import { toDocumentSettingsResponse, toOrganizationResponse } from "./organization-response";
import { requireActor, requireUser, type ActorEnv, type UserEnv } from "./require-actor";

const LOGO_HEADERS = {
  "cache-control": "private, max-age=300",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
  "x-content-type-options": "nosniff",
} as const;

const companySearchRoutes = new Hono<UserEnv>()
  .use(requireUser)
  .get("/company-search", validateQuery(companySearchQuery), async (context) => {
    const result = await searchCompanies(identityDependencies(context.var, context.env))(
      context.req.valid("query").q,
    );
    return result.isOk
      ? context.json({ companies: result.value })
      : identityErrorResponse(context, result.error, context.get("traceId"));
  });

const organizationSettingsRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .get("/organization", async (context) => {
    const result = await getOrganizationProfile(identityDependencies(context.var, context.env))(
      context.get("actor"),
    );
    return result.isOk
      ? context.json({ organization: toOrganizationResponse(result.value) })
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .get("/organization/document-settings", async (context) => {
    const result = await getOrganizationProfile(identityDependencies(context.var, context.env))(
      context.get("actor"),
    );
    return result.isOk
      ? context.json({ settings: toDocumentSettingsResponse(result.value) })
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .patch("/organization", validateJson(updateOrganizationBody), async (context) => {
    const result = await updateOrganizationProfile(identityDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("json"),
    );
    return result.isOk
      ? context.body(null, 204)
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .put("/organization/logo", async (context) => {
    const declaredLength = Number(context.req.header("content-length") ?? "0");
    if (declaredLength > LOGO_MAX_BYTES) {
      return identityErrorResponse(context, "invalid_logo", context.get("traceId"));
    }
    const result = await uploadOrganizationLogo(identityDependencies(context.var, context.env))(
      context.get("actor"),
      {
        body: await context.req.arrayBuffer(),
        contentType: context.req.header("content-type") ?? "",
      },
    );
    return result.isOk
      ? context.body(null, 204)
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .delete("/organization/logo", async (context) => {
    const result = await removeOrganizationLogo(identityDependencies(context.var, context.env))(
      context.get("actor"),
    );
    return result.isOk
      ? context.body(null, 204)
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .get("/organization/logo", async (context) => {
    const result = await getOrganizationLogo(identityDependencies(context.var, context.env))(
      context.get("actor"),
    );
    return result.isOk
      ? context.body(result.value.body, 200, {
          ...LOGO_HEADERS,
          "content-type": result.value.contentType,
        })
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .post("/organization/onboarding-completion", async (context) => {
    const result = await completeOnboarding(identityDependencies(context.var, context.env))(
      context.get("actor"),
    );
    return result.isOk
      ? context.body(null, 204)
      : identityErrorResponse(context, result.error, context.get("traceId"));
  });

export const organizationRoutes = { companySearchRoutes, organizationSettingsRoutes };
