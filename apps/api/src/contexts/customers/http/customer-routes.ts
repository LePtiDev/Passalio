import { Hono } from "hono";
import { requireActor, type ActorEnv } from "../../identity";
import { validateJson, validateParam, validateQuery } from "../../../platform/validation";
import { addSite } from "../application/add-site";
import { archiveCustomer } from "../application/archive-customer";
import { createCustomer } from "../application/create-customer";
import { getCustomerFile } from "../application/get-customer-file";
import { listCustomers } from "../application/list-customers";
import { updateCustomer } from "../application/update-customer";
import { updateSite } from "../application/update-site";
import { customerDependencies } from "./customer-context";
import {
  addSiteBody,
  createCustomerBody,
  customerParams,
  listCustomersQuery,
  siteParams,
  updateCustomerBody,
  updateSiteBody,
} from "./customer-http-schemas";
import { customerErrorResponse } from "./customer-responses";

export const customerRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .get("/customers", validateQuery(listCustomersQuery), async (context) => {
    const { q, cursor } = context.req.valid("query");
    const page = await listCustomers(customerDependencies(context.var, context.env))(
      context.get("actor"),
      { query: q, cursor },
    );
    return context.json(page);
  })
  .post("/customers", validateJson(createCustomerBody), async (context) => {
    const result = await createCustomer(customerDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("json"),
    );
    return result.isOk
      ? context.json(result.value, 201)
      : customerErrorResponse(context, result.error, context.get("traceId"));
  })
  .get("/customers/:customerId", validateParam(customerParams), async (context) => {
    const result = await getCustomerFile(customerDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("param"),
    );
    return result.isOk
      ? context.json(result.value)
      : customerErrorResponse(context, result.error, context.get("traceId"));
  })
  .patch(
    "/customers/:customerId",
    validateParam(customerParams),
    validateJson(updateCustomerBody),
    async (context) => {
      const result = await updateCustomer(customerDependencies(context.var, context.env))(
        context.get("actor"),
        { ...context.req.valid("param"), changes: context.req.valid("json") },
      );
      return result.isOk
        ? context.body(null, 204)
        : customerErrorResponse(context, result.error, context.get("traceId"));
    },
  )
  .delete("/customers/:customerId", validateParam(customerParams), async (context) => {
    const result = await archiveCustomer(customerDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("param"),
    );
    return result.isOk
      ? context.body(null, 204)
      : customerErrorResponse(context, result.error, context.get("traceId"));
  })
  .post(
    "/customers/:customerId/sites",
    validateParam(customerParams),
    validateJson(addSiteBody),
    async (context) => {
      const { id, ...site } = context.req.valid("json");
      const result = await addSite(customerDependencies(context.var, context.env))(
        context.get("actor"),
        { ...context.req.valid("param"), id, site },
      );
      return result.isOk
        ? context.json({ site: result.value }, 201)
        : customerErrorResponse(context, result.error, context.get("traceId"));
    },
  )
  .patch(
    "/sites/:siteId",
    validateParam(siteParams),
    validateJson(updateSiteBody),
    async (context) => {
      const result = await updateSite(customerDependencies(context.var, context.env))(
        context.get("actor"),
        { ...context.req.valid("param"), changes: context.req.valid("json") },
      );
      return result.isOk
        ? context.body(null, 204)
        : customerErrorResponse(context, result.error, context.get("traceId"));
    },
  );
