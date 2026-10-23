import {
  assertCan,
  EQUIPMENT_PHOTO_CONTENT_TYPES,
  EQUIPMENT_PHOTO_MAX_BYTES,
  err,
  newId,
  ok,
  parisDay,
  PLATE_READING_DAILY_LIMIT,
  plateReadingFieldCount,
  plateReadingStatusOf,
  sanitizePlateReading,
  type Actor,
  type PlateReadingResponse,
  type PlateReadingStatus,
  type Result,
} from "@passalio/shared";
import type { Logger } from "../../../platform/logger";
import type {
  PlateImage,
  PlateReader,
  PlateReaderUsage,
  PlateReadingError,
  PlateReadingRepository,
} from "../domain/plate-reading-ports";

export type PlateReadingDependencies = {
  readonly reader: PlateReader | undefined;
  readonly readings: PlateReadingRepository;
  readonly logger: Logger;
  readonly now: () => Date;
};

export type ReadEquipmentPlateInput = {
  readonly image: PlateImage;
  readonly traceId: string;
};

type Outcome = {
  readonly status: PlateReadingStatus;
  readonly fieldCount: number;
  readonly model: string;
  readonly usage: PlateReaderUsage;
};

const isAcceptedPhoto = ({ bytes, contentType }: PlateImage) =>
  EQUIPMENT_PHOTO_CONTENT_TYPES.some((accepted) => accepted === contentType) &&
  bytes.byteLength > 0 &&
  bytes.byteLength <= EQUIPMENT_PHOTO_MAX_BYTES;

export const readEquipmentPlate =
  ({ reader, readings, logger, now }: PlateReadingDependencies) =>
  async (
    actor: Actor,
    { image, traceId }: ReadEquipmentPlateInput,
  ): Promise<Result<PlateReadingResponse, PlateReadingError>> => {
    assertCan(actor, "customers:write");
    if (!isAcceptedPhoto(image)) {
      return err("invalid_photo");
    }
    if (reader === undefined) {
      return err("plate_reader_not_configured");
    }
    const at = now();
    const day = parisDay(at);
    if ((await readings.countOnDay(actor.organizationId, day)) >= PLATE_READING_DAILY_LIMIT) {
      logger.warn({ event: "plate_reading.limit_reached" });
      return err("plate_reading_limit_reached");
    }
    const record = async (outcome: Outcome) => {
      await readings.create({
        id: newId(),
        organizationId: actor.organizationId,
        userId: actor.userId,
        day,
        status: outcome.status,
        fieldCount: outcome.fieldCount,
        model: outcome.model,
        inputTokens: outcome.usage.inputTokens ?? null,
        outputTokens: outcome.usage.outputTokens ?? null,
        traceId,
        createdAt: at,
        updatedAt: at,
      });
    };
    const reply = await reader.read(image, traceId);
    if (!reply.isOk) {
      logger.error({
        event: "plate_reading.failed",
        model: reply.error.model,
        reason: reply.error.reason,
      });
      await record({
        status: "failed",
        fieldCount: 0,
        model: reply.error.model,
        usage: { inputTokens: undefined, outputTokens: undefined },
      });
      return err("plate_reader_unavailable");
    }
    const fields = sanitizePlateReading(reply.value.answer);
    const status = plateReadingStatusOf(fields);
    const fieldCount = plateReadingFieldCount(fields);
    await record({ status, fieldCount, model: reply.value.model, usage: reply.value.usage });
    logger.info({
      event: "plate_reading.completed",
      status,
      fieldCount,
      model: reply.value.model,
      inputTokens: reply.value.usage.inputTokens,
      outputTokens: reply.value.usage.outputTokens,
    });
    return ok({ status, fields, fieldCount });
  };
