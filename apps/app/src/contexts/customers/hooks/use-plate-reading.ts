import { plateReadingResponse, type PlateReadingFields } from "@passalio/shared";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { apiRequest, type ApiError } from "@/lib/api-client";
import { errorCodeLine } from "@/lib/errors";
import { plateFr } from "../plate-fr";
import { plateImageOf } from "../plate-image";
import type { PlateFormValues, PlateIdentityField, PlateMerge } from "../plate-reading";

export type PlateReadingState =
  | { readonly step: "idle" }
  | { readonly step: "reading" }
  | {
      readonly step: "read";
      readonly isPartial: boolean;
      readonly fieldCount: number;
      readonly readValues: PlateFormValues;
      readonly missingIdentity: readonly PlateIdentityField[];
    }
  | { readonly step: "unreadable" }
  | { readonly step: "limit" };

const IDLE: PlateReadingState = { step: "idle" };

const toastFailure = (error: ApiError) => {
  const description = errorCodeLine(error);
  toast.error(plateFr.failed, description === undefined ? {} : { description });
};

export const readPlate = async (photo: Blob) =>
  apiRequest("/plate-readings", plateReadingResponse, {
    method: "POST",
    file: await plateImageOf(photo),
  });

export const usePlateReading = (apply: (fields: PlateReadingFields) => PlateMerge) => {
  const [state, setState] = useState<PlateReadingState>(IDLE);
  const latest = useRef(0);
  const cancel = useCallback(() => {
    latest.current += 1;
    setState(IDLE);
  }, []);
  const start = useCallback(
    async (photo: Blob) => {
      latest.current += 1;
      const request = latest.current;
      if (!navigator.onLine) {
        setState(IDLE);
        return;
      }
      setState({ step: "reading" });
      const result = await readPlate(photo);
      if (request !== latest.current) {
        return;
      }
      if (!result.isOk) {
        const isLimit = result.error.code === "plate_reading_limit_reached";
        setState(isLimit ? { step: "limit" } : IDLE);
        if (!isLimit && result.error.code !== "plate_reader_not_configured") {
          toastFailure(result.error);
        }
        return;
      }
      const { status, fields, fieldCount } = result.value;
      if (status === "unreadable") {
        setState({ step: "unreadable" });
        return;
      }
      const merge = apply(fields);
      setState({
        step: "read",
        isPartial: status === "partial",
        fieldCount,
        readValues: merge.values,
        missingIdentity: merge.missingIdentity,
      });
    },
    [apply],
  );
  return { state, start, cancel };
};
