import {
  PROSPECT_STAGES,
  type ProspectFiltersResponse,
  type ProspectStage,
} from "@passalio/shared";
import { useMemo } from "react";
import { departmentLabel } from "../../department-names";
import { salesFr } from "../../fr";
import type { CompanyListScope } from "../../sales-api";
import type { FilterGroup } from "../list/list-filters";

const text = salesFr.list;

export const MOBILE_STAGE_TABS = ["all", "to_qualify", "interested"] as const;

const isMobileTab = (stage: ProspectStage | null) =>
  MOBILE_STAGE_TABS.some((tab) => tab === (stage ?? "all"));

export type CompanyListChanges = Partial<CompanyListScope>;

const toStage = (value: string | null): ProspectStage | null =>
  PROSPECT_STAGES.find((stage) => stage === value) ?? null;

export const departmentOptions = (filters: ProspectFiltersResponse | undefined) =>
  (filters?.departments ?? []).map(({ code }) => ({ value: code, label: departmentLabel(code) }));

export const useCompanyFilterGroups = (
  scope: CompanyListScope,
  filters: ProspectFiltersResponse | undefined,
  onChange: (changes: CompanyListChanges) => void,
): readonly FilterGroup[] =>
  useMemo(
    () => [
      {
        key: "stage",
        label: text.stage,
        anyLabel: text.anyStage,
        value: scope.stage,
        isMobileOnly: true,
        hasChip: !isMobileTab(scope.stage),
        options: PROSPECT_STAGES.map((stage) => ({ value: stage, label: salesFr.stages[stage] })),
        onChange: (value) => onChange({ stage: toStage(value) }),
      },
      {
        key: "department",
        label: text.department,
        anyLabel: text.anyDepartment,
        value: scope.department,
        options: departmentOptions(filters),
        onChange: (value) => onChange({ department: value }),
      },
      {
        key: "owner",
        label: text.owner,
        anyLabel: text.anyOwner,
        value: scope.owner,
        options: (filters?.owners ?? []).map(({ id, name }) => ({ value: id, label: name })),
        onChange: (value) => onChange({ owner: value }),
      },
    ],
    [scope.stage, scope.department, scope.owner, filters, onChange],
  );
