import { prospectContactChanges } from "@passalio/shared";
import { Hono } from "hono";
import { validateJson, validateParam, validateQuery } from "../../../platform/validation";
import { requirePlatformActor, type PlatformEnv } from "../../backoffice";
import { deleteContact } from "../application/delete-contact";
import { getContactFile } from "../application/get-contact-file";
import { listContacts } from "../application/list-contacts";
import { updateContact } from "../application/update-contact";
import { createSalesDependencies } from "../infrastructure/sales-dependencies";
import { salesErrorResponse } from "./sales-error-response";
import { contactParams, listContactsQuery } from "./sales-http-schemas";

const dependencies = (variables: PlatformEnv["Variables"]) =>
  createSalesDependencies(variables.database, variables.auditTrail);

export const contactRoutes = new Hono<PlatformEnv>()
  .use(requirePlatformActor)
  .get("/contacts", validateQuery(listContactsQuery), async (context) => {
    const { q, ...query } = context.req.valid("query");
    return context.json(
      await listContacts(dependencies(context.var))(context.var.platformActor, {
        ...query,
        query: q,
      }),
    );
  })
  .get("/contacts/:contactId", validateParam(contactParams), async (context) => {
    const result = await getContactFile(dependencies(context.var))(
      context.var.platformActor,
      context.req.valid("param").contactId,
    );
    return result.isOk ? context.json(result.value) : salesErrorResponse(context, result.error);
  })
  .patch(
    "/contacts/:contactId",
    validateParam(contactParams),
    validateJson(prospectContactChanges),
    async (context) => {
      const result = await updateContact(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("param").contactId,
        context.req.valid("json"),
      );
      return result.isOk ? context.body(null, 204) : salesErrorResponse(context, result.error);
    },
  )
  .delete("/contacts/:contactId", validateParam(contactParams), async (context) => {
    const result = await deleteContact(dependencies(context.var))(
      context.var.platformActor,
      context.req.valid("param").contactId,
    );
    return result.isOk ? context.body(null, 204) : salesErrorResponse(context, result.error);
  });
