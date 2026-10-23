import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { sanitizePlateReading } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import * as z from "zod";
import { createAiPlateReader } from "../src/contexts/customers/infrastructure/ai-plate-reader";
import { namedModelOf } from "../src/contexts/customers/infrastructure/plate-reader-models";
import { expectedPlate, scorePlate, summarize } from "./plate-reading-score";

const DEFAULT_PLATE_EVAL_DIR = "/mnt/project-files/lecture-de-plaque/jeu-de-test/";
const PLATE_EVAL_TIMEOUT_MS = 15 * 60 * 1000;

const evalDir = process.env["PLATE_EVAL_DIR"] ?? DEFAULT_PLATE_EVAL_DIR;
const modelSpecs = (process.env["PLATE_EVAL_MODELS"] ?? "")
  .split(",")
  .map((spec) => spec.trim())
  .filter((spec) => spec.length > 0);

const contentTypeOf = (file: string) => (file.endsWith(".png") ? "image/png" : "image/jpeg");

const evaluate = async (spec: string) => {
  const named = namedModelOf(spec, process.env);
  if (named === undefined) {
    throw new Error(`No model or no API key for ${spec}`);
  }
  const reader = createAiPlateReader([named]);
  const plates = z
    .array(expectedPlate)
    .parse(JSON.parse(await readFile(join(evalDir, "manifest.json"), "utf8")));
  const readings = await Promise.all(
    plates.map(async (plate) => {
      const bytes = new Uint8Array(await readFile(join(evalDir, plate.file)));
      const reply = await reader.read(
        { bytes, contentType: contentTypeOf(plate.file) },
        `eval-${plate.file}`,
      );
      return { plate, reply };
    }),
  );
  const scores = readings.map(({ plate, reply }) =>
    scorePlate(plate, reply.isOk ? sanitizePlateReading(reply.value.answer) : {}),
  );
  const usages = readings.flatMap(({ reply }) => (reply.isOk ? [reply.value.usage] : []));
  const failures = readings.length - usages.length;
  const inputTokens = usages.reduce((total, usage) => total + (usage.inputTokens ?? 0), 0);
  const outputTokens = usages.reduce((total, usage) => total + (usage.outputTokens ?? 0), 0);
  return { model: spec, ...summarize(scores), failures, inputTokens, outputTokens, scores };
};

describe.skipIf(modelSpecs.length === 0)("plate reading evaluation", () => {
  it.each(modelSpecs)(
    "measures %s on the test photos",
    async (spec) => {
      const report = await evaluate(spec);
      process.stdout.write(`${JSON.stringify(report)}\n`);
      expect(report.correct + report.missed + report.wrong).toBeGreaterThan(0);
    },
    PLATE_EVAL_TIMEOUT_MS,
  );
});
