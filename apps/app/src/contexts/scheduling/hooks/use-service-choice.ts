import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { EquipmentRecord, ServiceRecord } from "@/lib/db/local-records";
import { formatEuros } from "../fr";
import {
  chosenServices,
  serviceLinesOf,
  suggestedServiceIds,
  usualDurationOf,
  usualPriceCentsOf,
  visitTypesOf,
} from "../services";
import { DEFAULT_DURATION_MINUTES, type VisitFormValues } from "../visit-form-schema";
import { useOfferedServices } from "./use-services";

const NO_SERVICES: readonly ServiceRecord[] = [];

const priceTextOf = (cents: number | null) => (cents === null ? "" : formatEuros(cents));

export const useServiceChoice = (
  form: UseFormReturn<VisitFormValues>,
  equipments: readonly EquipmentRecord[],
) => {
  const { control, setValue, getValues, formState } = form;
  const offered = useOfferedServices();
  const [isChosenByHand, setIsChosenByHand] = useState(false);
  const equipmentIds = useWatch({ control, name: "equipmentIds" });
  const serviceLines = useWatch({ control, name: "serviceLines" });
  const durationMinutes = useWatch({ control, name: "durationMinutes" });
  const isSubmitted = formState.isSubmitted;

  const apply = useCallback(
    (serviceIds: readonly string[]) => {
      const previous = chosenServices(
        offered ?? NO_SERVICES,
        (getValues("serviceLines") ?? []).map(({ serviceId }) => serviceId),
      );
      const chosen = chosenServices(offered ?? NO_SERVICES, serviceIds);
      setValue("serviceLines", serviceLinesOf(chosen), { shouldValidate: isSubmitted });
      setValue("visitTypes", visitTypesOf(chosen));
      const usual = usualDurationOf(chosen);
      if (usual > 0) {
        setValue("durationMinutes", usual);
      }
      const price = getValues("price").trim();
      if (price === "" || price === priceTextOf(usualPriceCentsOf(previous))) {
        setValue("price", priceTextOf(usualPriceCentsOf(chosen)), {
          shouldValidate: isSubmitted,
        });
      }
    },
    [setValue, getValues, isSubmitted, offered],
  );

  const kinds = equipments.filter(({ id }) => equipmentIds.includes(id)).map(({ kind }) => kind);
  const suggestion =
    offered === undefined || offered.length === 0
      ? null
      : suggestedServiceIds(offered, kinds).join();

  const appliedSuggestion = useRef<string | null>(null);
  useEffect(() => {
    if (suggestion !== null && !isChosenByHand && suggestion !== appliedSuggestion.current) {
      appliedSuggestion.current = suggestion;
      apply(suggestion.split(",").filter((serviceId) => serviceId !== ""));
    }
  }, [suggestion, isChosenByHand, apply]);

  const chooseServices = useCallback(
    (serviceIds: readonly string[]) => {
      setIsChosenByHand(true);
      apply(serviceIds);
    },
    [apply],
  );
  const chooseDuration = useCallback(
    (minutes: number) => setValue("durationMinutes", minutes),
    [setValue],
  );
  const chosenIds = useMemo(
    () => (serviceLines ?? []).map(({ serviceId }) => serviceId),
    [serviceLines],
  );
  const chosen = useMemo(
    () => chosenServices(offered ?? NO_SERVICES, chosenIds),
    [offered, chosenIds],
  );

  return {
    offered: offered ?? NO_SERVICES,
    chosenIds,
    chosen,
    durationMinutes: durationMinutes ?? DEFAULT_DURATION_MINUTES,
    error: formState.errors.serviceLines?.message,
    chooseServices,
    chooseDuration,
  };
};
