import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { CustomerError } from "../domain/customer-error";

const ERROR_STATUS: Readonly<Record<CustomerError, ContentfulStatusCode>> = {
  customer_not_found: 404,
  site_not_found: 404,
  equipment_not_found: 404,
  photo_not_found: 404,
  customer_name_required: 422,
  already_exists: 409,
  equipment_kind_not_offered: 422,
  invalid_equipment_details: 422,
  equipment_already_removed: 409,
  invalid_photo: 422,
};

export const customerErrorResponse = (context: Context, error: CustomerError, traceId: string) =>
  context.json({ error, traceId }, ERROR_STATUS[error]);
