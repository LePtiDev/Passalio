import { isVisitType, type TradeId } from "@passalio/trades";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { EquipmentRecord } from "@/lib/db/local-records";
import { DEFAULT_DURATION_MINUTES, type VisitFormValues } from "../visit-form-schema";
import { chosenVisitTypes, suggestedVisitTypes, usualDurationOf } from "../visit-types";
import { useOfferedVisitTypes } from "./use-visit-types";

export const useVisitTypeChoice = (
  form: UseFormReturn<VisitFormValues>,
  equipments: readonly EquipmentRecord[],
) => {
  const { control, setValue, formState } = form;
  const offered = useOfferedVisitTypes();
  const [isChosenByHand, setIsChosenByHand] = useState(false);
  const equipmentIds = useWatch({ control, name: "equipmentIds" });
  const visitTypes = useWatch({ control, name: "visitTypes" });
  const durationMinutes = useWatch({ control, name: "durationMinutes" });
  const isSubmitted = formState.isSubmitted;

  const apply = useCallback(
    (types: TradeId[]) => {
      setValue("visitTypes", types, { shouldValidate: isSubmitted });
      const usual = usualDurationOf(chosenVisitTypes(offered ?? [], types));
      if (usual > 0) {
        setValue("durationMinutes", usual);
      }
    },
    [setValue, isSubmitted, offered],
  );

  const kinds = equipments.filter(({ id }) => equipmentIds.includes(id)).map(({ kind }) => kind);
  const suggestion =
    offered === undefined || offered.length === 0
      ? null
      : suggestedVisitTypes(offered, kinds).join();

  const appliedSuggestion = useRef<string | null>(null);
  useEffect(() => {
    if (suggestion !== null && !isChosenByHand && suggestion !== appliedSuggestion.current) {
      appliedSuggestion.current = suggestion;
      apply(suggestion.split(",").filter(isVisitType));
    }
  }, [suggestion, isChosenByHand, apply]);

  const chooseTypes = useCallback(
    (types: TradeId[]) => {
      setIsChosenByHand(true);
      apply(types);
    },
    [apply],
  );
  const chooseDuration = useCallback(
    (minutes: number) => setValue("durationMinutes", minutes),
    [setValue],
  );
  const chosenTypes = useMemo(() => visitTypes ?? [], [visitTypes]);
  const chosen = useMemo(
    () => chosenVisitTypes(offered ?? [], chosenTypes),
    [offered, chosenTypes],
  );

  return {
    offered: offered ?? [],
    chosenTypes,
    chosen,
    durationMinutes: durationMinutes ?? DEFAULT_DURATION_MINUTES,
    error: formState.errors.visitTypes?.message,
    chooseTypes,
    chooseDuration,
  };
};
