import type { CallSeriesTarget } from "@passalio/shared";

export const CALL_SERIES_MIN_SIZE = 5;

export const CALL_SERIES_MAX_SIZE = 30;

export const CALL_SERIES_DEFAULT_SIZE = 10;

export type CallSession =
  | {
      readonly kind: "series";
      readonly department: string | null;
      readonly target: CallSeriesTarget;
      readonly size: number;
    }
  | { readonly kind: "day" }
  | { readonly kind: "single"; readonly companyId: string; readonly taskId: string | null };

export type QueuedCall = {
  readonly companyId: string;
  readonly taskId: string | null;
  readonly contactId: string | null;
  readonly name: string | null;
  readonly dueAt: string | null;
};
