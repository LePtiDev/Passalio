import {
  PLATE_READING_FIELDS,
  type PlateReadingField,
  type PlateReadingFields,
} from "@passalio/shared";
import * as z from "zod";

export const expectedPlate = z.object({
  file: z.string(),
  kind: z.string().nullable(),
  kindAlternatives: z.array(z.string()).optional(),
  energy: z.string().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  serialNumber: z.string().nullable(),
  powerKw: z.number().nullable(),
  refrigerant: z.string().nullable(),
  refrigerantChargeKg: z.number().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export type ExpectedPlate = z.infer<typeof expectedPlate>;

export type FieldOutcome = "correct" | "missed" | "wrong" | "invented" | "absent";

export type FieldScore = {
  readonly field: PlateReadingField;
  readonly outcome: FieldOutcome;
};

export type PlateScore = {
  readonly file: string;
  readonly fields: readonly FieldScore[];
};

const normalizedText = (value: string) => value.toLowerCase().replaceAll(/[\s\-./_]/g, "");

const NUMBER_TOLERANCE = 0.01;

const isSameValue = (expected: string | number, read: string | number): boolean => {
  if (typeof expected === "number" && typeof read === "number") {
    return Math.abs(expected - read) <= Math.max(NUMBER_TOLERANCE, Math.abs(expected) * 0.01);
  }
  return normalizedText(String(expected)) === normalizedText(String(read));
};

const acceptedValues = (
  expected: ExpectedPlate,
  field: PlateReadingField,
): readonly (string | number)[] => {
  const value = expected[field];
  if (value === null) {
    return [];
  }
  return field === "kind" ? [value, ...(expected.kindAlternatives ?? [])] : [value];
};

const outcomeOf = (
  accepted: readonly (string | number)[],
  read: string | number | undefined,
): FieldOutcome => {
  if (accepted.length === 0) {
    return read === undefined ? "absent" : "invented";
  }
  if (read === undefined) {
    return "missed";
  }
  return accepted.some((value) => isSameValue(value, read)) ? "correct" : "wrong";
};

export const scorePlate = (expected: ExpectedPlate, read: PlateReadingFields): PlateScore => ({
  file: expected.file,
  fields: PLATE_READING_FIELDS.map((field) => ({
    field,
    outcome: outcomeOf(acceptedValues(expected, field), read[field]),
  })),
});

export type ModelSummary = {
  readonly correct: number;
  readonly missed: number;
  readonly wrong: number;
  readonly invented: number;
  readonly accuracy: number;
};

export const summarize = (scores: readonly PlateScore[]): ModelSummary => {
  const outcomes = scores.flatMap(({ fields }) => fields.map(({ outcome }) => outcome));
  const countOf = (outcome: FieldOutcome) => outcomes.filter((value) => value === outcome).length;
  const correct = countOf("correct");
  const missed = countOf("missed");
  const wrong = countOf("wrong");
  const invented = countOf("invented");
  const judged = correct + missed + wrong + invented;
  return { correct, missed, wrong, invented, accuracy: judged === 0 ? 0 : correct / judged };
};
