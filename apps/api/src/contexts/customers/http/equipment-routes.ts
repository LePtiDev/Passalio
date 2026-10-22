import { EQUIPMENT_PHOTO_MAX_BYTES } from "@passalio/shared";
import { Hono } from "hono";
import { requireActor, type ActorEnv } from "../../identity";
import { validateJson, validateParam, validateQuery } from "../../../platform/validation";
import { addEquipment } from "../application/add-equipment";
import { getEquipmentPhoto } from "../application/get-equipment-photo";
import { removeEquipment } from "../application/remove-equipment";
import { updateEquipment } from "../application/update-equipment";
import { uploadEquipmentPhoto } from "../application/upload-equipment-photo";
import { customerDependencies } from "./customer-context";
import {
  addEquipmentBody,
  equipmentParams,
  photoParams,
  removeEquipmentBody,
  siteParams,
  updateEquipmentBody,
  uploadPhotoQuery,
} from "./customer-http-schemas";
import { customerErrorResponse } from "./customer-responses";

const PHOTO_HEADERS = {
  "cache-control": "private, max-age=86400, immutable",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
  "x-content-type-options": "nosniff",
} as const;

export const equipmentRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .post(
    "/sites/:siteId/equipments",
    validateParam(siteParams),
    validateJson(addEquipmentBody),
    async (context) => {
      const { id, replacesEquipmentId, ...equipment } = context.req.valid("json");
      const result = await addEquipment(customerDependencies(context.var, context.env))(
        context.get("actor"),
        { ...context.req.valid("param"), id, replacesEquipmentId, equipment },
      );
      return result.isOk
        ? context.json({ equipment: result.value }, 201)
        : customerErrorResponse(context, result.error, context.get("traceId"));
    },
  )
  .patch(
    "/equipments/:equipmentId",
    validateParam(equipmentParams),
    validateJson(updateEquipmentBody),
    async (context) => {
      const result = await updateEquipment(customerDependencies(context.var, context.env))(
        context.get("actor"),
        { ...context.req.valid("param"), changes: context.req.valid("json") },
      );
      return result.isOk
        ? context.body(null, 204)
        : customerErrorResponse(context, result.error, context.get("traceId"));
    },
  )
  .post(
    "/equipments/:equipmentId/removal",
    validateParam(equipmentParams),
    validateJson(removeEquipmentBody),
    async (context) => {
      const result = await removeEquipment(customerDependencies(context.var, context.env))(
        context.get("actor"),
        { ...context.req.valid("param"), ...context.req.valid("json") },
      );
      return result.isOk
        ? context.body(null, 204)
        : customerErrorResponse(context, result.error, context.get("traceId"));
    },
  )
  .post(
    "/equipments/:equipmentId/photos",
    validateParam(equipmentParams),
    validateQuery(uploadPhotoQuery),
    async (context) => {
      const declaredLength = Number(context.req.header("content-length") ?? "0");
      if (declaredLength > EQUIPMENT_PHOTO_MAX_BYTES) {
        return customerErrorResponse(context, "invalid_photo", context.get("traceId"));
      }
      const { id, kind, takenAt } = context.req.valid("query");
      const result = await uploadEquipmentPhoto(customerDependencies(context.var, context.env))(
        context.get("actor"),
        {
          ...context.req.valid("param"),
          id,
          kind,
          takenAt: takenAt === undefined ? undefined : new Date(takenAt),
          body: await context.req.arrayBuffer(),
          contentType: context.req.header("content-type") ?? "",
        },
      );
      return result.isOk
        ? context.json({ photo: result.value }, 201)
        : customerErrorResponse(context, result.error, context.get("traceId"));
    },
  )
  .get("/photos/:photoId", validateParam(photoParams), async (context) => {
    const result = await getEquipmentPhoto(customerDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("param"),
    );
    return result.isOk
      ? context.body(result.value.body, 200, {
          ...PHOTO_HEADERS,
          "content-type": result.value.contentType,
        })
      : customerErrorResponse(context, result.error, context.get("traceId"));
  });
