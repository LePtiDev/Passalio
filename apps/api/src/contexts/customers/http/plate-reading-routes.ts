import { EQUIPMENT_PHOTO_MAX_BYTES } from "@passalio/shared";
import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { requireActor, type ActorEnv } from "../../identity";
import { readEquipmentPlate } from "../application/read-equipment-plate";
import type { PlateReadingError } from "../domain/plate-reading-ports";
import { plateReadingDependencies } from "./plate-reading-context";

const ERROR_STATUS: Readonly<Record<PlateReadingError, ContentfulStatusCode>> = {
  invalid_photo: 422,
  plate_reader_not_configured: 503,
  plate_reading_limit_reached: 429,
  plate_reader_unavailable: 503,
};

const plateReadingErrorResponse = (context: Context, error: PlateReadingError, traceId: string) =>
  context.json({ error, traceId }, ERROR_STATUS[error]);

export const plateReadingRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .post("/plate-readings", async (context) => {
    const traceId = context.get("traceId");
    const declaredLength = Number(context.req.header("content-length") ?? "0");
    if (declaredLength > EQUIPMENT_PHOTO_MAX_BYTES) {
      return plateReadingErrorResponse(context, "invalid_photo", traceId);
    }
    const result = await readEquipmentPlate(plateReadingDependencies(context.var, context.env))(
      context.get("actor"),
      {
        image: {
          bytes: new Uint8Array(await context.req.arrayBuffer()),
          contentType: context.req.header("content-type") ?? "",
        },
        traceId,
      },
    );
    return result.isOk
      ? context.json(result.value, 200)
      : plateReadingErrorResponse(context, result.error, traceId);
  });
