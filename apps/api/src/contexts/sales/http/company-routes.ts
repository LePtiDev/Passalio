import {
  prospectCompanyChanges,
  prospectCompanyFields,
  prospectContactFields,
  prospectNote,
  prospectStageChange,
} from "@passalio/shared";
import { Hono } from "hono";
import { validateJson, validateParam, validateQuery } from "../../../platform/validation";
import { requirePlatformActor, type PlatformEnv } from "../../backoffice";
import { addCompanyNote } from "../application/add-company-note";
import { addContact } from "../application/add-contact";
import { changeCompanyStage } from "../application/change-company-stage";
import { createCompany } from "../application/create-company";
import { deleteCompany } from "../application/delete-company";
import { getCompanyFile } from "../application/get-company-file";
import { getProspectFilters } from "../application/get-prospect-filters";
import { getProspectMap } from "../application/get-prospect-map";
import { listCompanies } from "../application/list-companies";
import { updateCompany } from "../application/update-company";
import { createSalesDependencies } from "../infrastructure/sales-dependencies";
import { salesErrorResponse } from "./sales-error-response";
import { companyParams, listCompaniesQuery, mapQuery } from "./sales-http-schemas";

const dependencies = (variables: PlatformEnv["Variables"]) =>
  createSalesDependencies(variables.database, variables.auditTrail);

export const companyRoutes = new Hono<PlatformEnv>()
  .use(requirePlatformActor)
  .get("/filters", async (context) =>
    context.json(await getProspectFilters(dependencies(context.var))(context.var.platformActor)),
  )
  .get("/map", validateQuery(mapQuery), async (context) =>
    context.json(
      await getProspectMap(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("query"),
      ),
    ),
  )
  .get("/companies", validateQuery(listCompaniesQuery), async (context) => {
    const { owner, q, ...query } = context.req.valid("query");
    return context.json(
      await listCompanies(dependencies(context.var))(context.var.platformActor, {
        ...query,
        ownerUserId: owner,
        query: q,
      }),
    );
  })
  .post("/companies", validateJson(prospectCompanyFields), async (context) =>
    context.json(
      await createCompany(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("json"),
      ),
      201,
    ),
  )
  .get("/companies/:companyId", validateParam(companyParams), async (context) => {
    const result = await getCompanyFile(dependencies(context.var))(
      context.var.platformActor,
      context.req.valid("param").companyId,
    );
    return result.isOk ? context.json(result.value) : salesErrorResponse(context, result.error);
  })
  .patch(
    "/companies/:companyId",
    validateParam(companyParams),
    validateJson(prospectCompanyChanges),
    async (context) => {
      const result = await updateCompany(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("param").companyId,
        context.req.valid("json"),
      );
      return result.isOk ? context.body(null, 204) : salesErrorResponse(context, result.error);
    },
  )
  .delete("/companies/:companyId", validateParam(companyParams), async (context) => {
    const result = await deleteCompany(dependencies(context.var))(
      context.var.platformActor,
      context.req.valid("param").companyId,
    );
    return result.isOk ? context.body(null, 204) : salesErrorResponse(context, result.error);
  })
  .post(
    "/companies/:companyId/stage",
    validateParam(companyParams),
    validateJson(prospectStageChange),
    async (context) => {
      const result = await changeCompanyStage(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("param").companyId,
        context.req.valid("json").stage,
      );
      return result.isOk ? context.body(null, 204) : salesErrorResponse(context, result.error);
    },
  )
  .post(
    "/companies/:companyId/notes",
    validateParam(companyParams),
    validateJson(prospectNote),
    async (context) => {
      const result = await addCompanyNote(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("param").companyId,
        context.req.valid("json"),
      );
      return result.isOk
        ? context.json(result.value, 201)
        : salesErrorResponse(context, result.error);
    },
  )
  .post(
    "/companies/:companyId/contacts",
    validateParam(companyParams),
    validateJson(prospectContactFields),
    async (context) => {
      const result = await addContact(dependencies(context.var))(
        context.var.platformActor,
        context.req.valid("param").companyId,
        context.req.valid("json"),
      );
      return result.isOk
        ? context.json(result.value, 201)
        : salesErrorResponse(context, result.error);
    },
  );
