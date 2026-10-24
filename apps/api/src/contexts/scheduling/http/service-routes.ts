import { serviceChanges, serviceFields } from "@passalio/trades";
import { Hono } from "hono";
import * as z from "zod";
import { requireActor, type ActorEnv } from "../../identity";
import { validateJson, validateParam } from "../../../platform/validation";
import {
  archiveService,
  createService,
  listServices,
  updateService,
} from "../application/manage-services";
import { serviceDependencies } from "./scheduling-context";

const serviceParams = z.object({ serviceId: z.uuid() });

const serviceNotFound = (traceId: string) => ({ error: "service_not_found", traceId });

export const serviceRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .get("/services", async (context) =>
    context.json({
      services: await listServices(serviceDependencies(context.var))(context.get("actor")),
    }),
  )
  .post("/services", validateJson(serviceFields), async (context) =>
    context.json(
      {
        service: await createService(serviceDependencies(context.var))(
          context.get("actor"),
          context.req.valid("json"),
        ),
      },
      201,
    ),
  )
  .patch(
    "/services/:serviceId",
    validateParam(serviceParams),
    validateJson(serviceChanges),
    async (context) => {
      const result = await updateService(serviceDependencies(context.var))(context.get("actor"), {
        ...context.req.valid("param"),
        changes: context.req.valid("json"),
      });
      return result.isOk
        ? context.json({ service: result.value })
        : context.json(serviceNotFound(context.get("traceId")), 404);
    },
  )
  .post("/services/:serviceId/archive", validateParam(serviceParams), async (context) => {
    const result = await archiveService(serviceDependencies(context.var))(
      context.get("actor"),
      context.req.valid("param"),
    );
    return result.isOk
      ? context.body(null, 204)
      : context.json(serviceNotFound(context.get("traceId")), 404);
  });
