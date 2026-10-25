import { CALL_SERIES_TARGETS, type CallSeriesTarget } from "@passalio/shared";
import * as z from "zod";
import { callsFr } from "../../fr-calls";
import {
  CALL_SERIES_DEFAULT_SIZE,
  CALL_SERIES_MAX_SIZE,
  CALL_SERIES_MIN_SIZE,
} from "./call-session";

export const ANY_DEPARTMENT = "all";

const sizeOf = (value: string) => Number.parseInt(value, 10);

const isSizeInRange = (value: string) =>
  /^\d+$/.test(value) &&
  sizeOf(value) >= CALL_SERIES_MIN_SIZE &&
  sizeOf(value) <= CALL_SERIES_MAX_SIZE;

export const callSeriesFormSchema = z.object({
  size: z.string().trim().refine(isSizeInRange, callsFr.calls.sizeError),
  department: z.string(),
  target: z.enum(CALL_SERIES_TARGETS),
});

export type CallSeriesFormValues = z.infer<typeof callSeriesFormSchema>;

export const emptyCallSeriesForm = (department: string | null): CallSeriesFormValues => ({
  size: String(CALL_SERIES_DEFAULT_SIZE),
  department: department ?? ANY_DEPARTMENT,
  target: "never_called",
});

export const validSizeOf = (value: string): number | null =>
  isSizeInRange(value.trim()) ? sizeOf(value.trim()) : null;

export type CallSeriesSearch = {
  readonly nombre: number;
  readonly cible: CallSeriesTarget;
  readonly departement?: string;
};

export const toCallSeriesSearch = (values: CallSeriesFormValues): CallSeriesSearch => ({
  nombre: sizeOf(values.size),
  cible: values.target,
  ...(values.department === ANY_DEPARTMENT ? {} : { departement: values.department }),
});
