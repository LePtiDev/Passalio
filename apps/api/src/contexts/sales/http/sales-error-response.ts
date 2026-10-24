import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ProspectError } from "../domain/prospect-error";

const ERROR_STATUS: Readonly<Record<ProspectError, ContentfulStatusCode>> = {
  company_not_found: 404,
  contact_not_found: 404,
  owner_not_found: 422,
  contact_not_in_company: 422,
  task_not_found: 404,
  task_closed: 409,
};

export const salesErrorResponse = (context: Context, error: ProspectError) =>
  context.json({ error, traceId: context.get("traceId") }, ERROR_STATUS[error]);
