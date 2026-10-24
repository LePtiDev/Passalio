import { prospectCallLog, prospectQualification, prospectTaskChange } from "@passalio/shared";
import { Hono } from "hono";
import { validateJson, validateParam, validateQuery } from "../../../platform/validation";
import { requirePlatformActor, type PlatformEnv } from "../../backoffice";
import { getFollowUp } from "../application/get-follow-up";
import { getMyDay } from "../application/get-my-day";
import { listCallSeries } from "../application/list-call-series";
import { logCall } from "../application/log-call";
import { updateQualification } from "../application/update-qualification";
import { updateTask } from "../application/update-task";
import { createSalesDependencies } from "../infrastructure/sales-dependencies";
import { salesErrorResponse } from "./sales-error-response";
import { callSeriesQuery, companyParams, taskParams } from "./sales-http-schemas";

const dependencies = (variables: PlatformEnv["Variables"]) =>
  createSalesDependencies(variables.database, variables.auditTrail);

export const callRoutes = new Hono<PlatformEnv>()
  .use(requirePlatformActor)
  .get("/my-day", async (context) =>
    context.json(await getMyDay(dependencies(context.var))(context.var.platformActor)),
  )
  .get("/call-series", validateQuery(callSeriesQuery), async (context) =>
    context.json(
      await listCallSeries(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("query"),
      ),
    ),
  )
  .get("/companies/:companyId/follow-up", validateParam(companyParams), async (context) => {
    const result = await getFollowUp(dependencies(context.var))(
      context.var.platformActor,
      context.req.valid("param").companyId,
    );
    return result.isOk ? context.json(result.value) : salesErrorResponse(context, result.error);
  })
  .post(
    "/companies/:companyId/calls",
    validateParam(companyParams),
    validateJson(prospectCallLog),
    async (context) => {
      const result = await logCall(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("param").companyId,
        context.req.valid("json"),
      );
      return result.isOk
        ? context.json(result.value, 201)
        : salesErrorResponse(context, result.error);
    },
  )
  .patch(
    "/companies/:companyId/qualification",
    validateParam(companyParams),
    validateJson(prospectQualification),
    async (context) => {
      const result = await updateQualification(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("param").companyId,
        context.req.valid("json"),
      );
      return result.isOk ? context.body(null, 204) : salesErrorResponse(context, result.error);
    },
  )
  .patch(
    "/tasks/:taskId",
    validateParam(taskParams),
    validateJson(prospectTaskChange),
    async (context) => {
      const result = await updateTask(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("param").taskId,
        context.req.valid("json"),
      );
      return result.isOk ? context.body(null, 204) : salesErrorResponse(context, result.error);
    },
  );
