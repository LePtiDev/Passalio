import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import type { PlanningSearch, PlanningView } from "../planning-search";

export const usePlanningNavigation = () => {
  const navigate = useNavigate({ from: "/planning" });
  const update = useCallback(
    (changes: Partial<PlanningSearch>) =>
      navigate({ search: (previous) => ({ ...previous, ...changes }), replace: true }),
    [navigate],
  );
  return {
    goToDay: useCallback((day: string) => update({ jour: day, passage: undefined }), [update]),
    setView: useCallback((view: PlanningView) => update({ vue: view }), [update]),
    setAgendas: useCallback(
      (agendas: string | undefined) => update({ agendas, passage: undefined }),
      [update],
    ),
    closePanel: useCallback(() => update({ passage: undefined }), [update]),
  };
};
