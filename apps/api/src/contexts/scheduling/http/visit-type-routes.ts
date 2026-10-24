import { visitDurations } from "@passalio/trades";
import type { Context } from "hono";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { requireActor, type ActorEnv } from "../../identity";
import { validateJson } from "../../../platform/validation";
import { getVisitTypes } from "../application/get-visit-types";
import { updateVisitDurations } from "../application/update-visit-durations";
import type { VisitTypeError } from "../domain/visit-type-ports";
import { visitTypeDependencies } from "./scheduling-context";

const ERROR_STATUS: Readonly<Record<VisitTypeError, ContentfulStatusCode>> = {
  organization_not_found: 404,
  invalid_visit_type: 422,
};

const visitTypeErrorResponse = (context: Context, error: VisitTypeError, traceId: string) =>
  context.json({ error, traceId }, ERROR_STATUS[error]);

export const visitTypeRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .get("/visit-types", async (context) => {
    const result = await getVisitTypes(visitTypeDependencies(context.var))(context.get("actor"));
    return result.isOk
      ? context.json({ visitTypes: result.value })
      : visitTypeErrorResponse(context, result.error, context.get("traceId"));
  })
  .patch("/visit-types/durations", validateJson(visitDurations), async (context) => {
    const result = await updateVisitDurations(visitTypeDependencies(context.var))(
      context.get("actor"),
      context.req.valid("json"),
    );
    return result.isOk
      ? context.json({ visitTypes: result.value })
      : visitTypeErrorResponse(context, result.error, context.get("traceId"));
  });
