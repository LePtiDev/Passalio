import { ok, type PlateReaderAnswer } from "@passalio/shared";
import type { PlateReader } from "../domain/plate-reading-ports";

export const FAKE_PLATE_READER_MODEL = "fake";

export const FAKE_PLATE_ANSWER: PlateReaderAnswer = {
  kind: "pellet_stove",
  energy: "pellets",
  brand: "MCZ",
  model: "Ego 2.0 Air 8",
  serialNumber: null,
  powerKw: 8,
  refrigerant: null,
  refrigerantChargeKg: null,
};

export const createFakePlateReader = (): PlateReader => ({
  read: async () =>
    ok({
      answer: FAKE_PLATE_ANSWER,
      model: FAKE_PLATE_READER_MODEL,
      usage: { inputTokens: 0, outputTokens: 0 },
    }),
});
