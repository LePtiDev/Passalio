import type { PlateReading, PlateReadingRepository } from "../domain/plate-reading-ports";

export const createInMemoryPlateReadingRepository = (
  readings: PlateReading[],
): PlateReadingRepository => ({
  countOnDay: async (organizationId, day) =>
    readings.filter((reading) => reading.organizationId === organizationId && reading.day === day)
      .length,
  create: async (reading) => {
    readings.push(reading);
  },
});
