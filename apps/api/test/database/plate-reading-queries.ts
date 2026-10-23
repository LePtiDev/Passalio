import type { CatalogedQuery } from "./cataloged-query";
import { aPlateReading } from "./field-fixtures";

export const PLATE_READING_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "plateReadings.countOnDay",
    query: "plate readings of the organization today, for the daily quota",
    run: (r, s) => r.plateReadings.countOnDay(s.organization.id, "2026-10-22"),
  },
  {
    method: "plateReadings.create",
    query: "record a plate reading",
    run: (r, s) => r.plateReadings.create(aPlateReading(s.organization.id, s.technician.id)),
  },
];
