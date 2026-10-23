import { plateReadings } from "@passalio/db";
import { and, count, eq } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { PlateReadingRepository } from "../domain/plate-reading-ports";

export const createD1PlateReadingRepository = (database: Database): PlateReadingRepository => ({
  countOnDay: async (organizationId, day) =>
    (
      await database
        .select({ total: count() })
        .from(plateReadings)
        .where(and(eq(plateReadings.organizationId, organizationId), eq(plateReadings.day, day)))
        .get()
    )?.total ?? 0,
  create: async (reading) => {
    await database.insert(plateReadings).values(reading);
  },
});
