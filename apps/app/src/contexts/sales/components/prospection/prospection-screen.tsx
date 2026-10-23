import { useCallback, useMemo } from "react";
import { ErrorState } from "@/components/error-state";
import { AdminHeading, AdminPage, type AdminTrailStep } from "@/contexts/backoffice";
import { CursorPagination } from "@/components/pagination";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { usePagedList } from "@/lib/use-paged-list";
import { departmentLocative } from "../../department-locatives";
import { departmentLabel, departmentName } from "../../department-names";
import { salesFr } from "../../fr";
import {
  useCompaniesPage,
  useProspectFilters,
  useProspectMap,
} from "../../hooks/use-sales-queries";
import { departmentOptions } from "../companies/company-list-filters";
import type { FilterGroup } from "../list/list-filters";
import { ListTabs } from "../list/list-tabs";
import { ListToolbar } from "../list/list-toolbar";
import { ProspectMap } from "../map/prospect-map";
import { LeadCard, LeadCardSkeleton } from "./lead-card";
import { LeadList, LeadListSkeleton } from "./lead-list";
import { LeadSheet, LeadSheetSkeleton } from "./lead-sheet";
import { MapSearch } from "./map-search";
import { ProspectionEmpty, ProspectionSheetEmpty } from "./prospection-empty";
import {
  neighbourOf,
  pinsMatching,
  PROSPECTION_TABS,
  type ProspectionTab,
  type ProspectionChanges,
  type ProspectionScope,
} from "./prospection-scope";

const text = salesFr.prospection;

const SEARCH_DELAY_MS = 300;

const LEAD_ROW_HEIGHTS = { mobile: 55, desktop: 55 } as const;

const TRAIL: readonly AdminTrailStep[] = [{ label: text.title }];

type ProspectionScreenProps = {
  readonly scope: ProspectionScope;
  readonly onScopeChange: (changes: ProspectionChanges) => void;
};

export const ProspectionScreen = ({ scope, onScopeChange }: ProspectionScreenProps) => {
  const search = useDebouncedValue(scope.search.trim(), SEARCH_DELAY_MS);
  const listScope = useMemo(
    () => ({ stage: scope.tab, department: scope.department, owner: null, search }),
    [scope.tab, scope.department, search],
  );
  const { measureList, ...paging } = usePagedList(JSON.stringify(listScope), LEAD_ROW_HEIGHTS);
  const companies = useCompaniesPage(listScope, paging.cursor, paging.pageSize);
  const map = useProspectMap(scope.department);
  const filters = useProspectFilters();
  const rows = useMemo(() => companies.data?.companies ?? [], [companies.data]);
  const pins = useMemo(() => pinsMatching(map.data?.pins ?? [], search), [map.data, search]);
  const selectedId = scope.companyId ?? rows[0]?.id ?? null;
  const counts = companies.data?.counts ?? null;
  const count = counts === null ? null : counts[scope.tab];

  const { refetch: refetchCompanies } = companies;
  const { refetch: refetchMap } = map;
  const retry = useCallback(() => {
    void refetchCompanies();
    void refetchMap();
  }, [refetchCompanies, refetchMap]);
  const select = useCallback((companyId: string) => onScopeChange({ companyId }), [onScopeChange]);
  const selectNext = useCallback(
    (companyId: string) =>
      onScopeChange({
        companyId: neighbourOf(
          rows.map(({ id }) => id),
          companyId,
        ),
      }),
    [onScopeChange, rows],
  );
  const selectTab = useCallback(
    (tab: ProspectionTab) => onScopeChange({ tab, companyId: null }),
    [onScopeChange],
  );
  const changeSearch = useCallback(
    (value: string) => onScopeChange({ search: value, companyId: null }),
    [onScopeChange],
  );
  const clearSearch = useCallback(() => onScopeChange({ search: "" }), [onScopeChange]);
  const clearDepartment = useCallback(
    () => onScopeChange({ department: null, companyId: null }),
    [onScopeChange],
  );
  const groups = useMemo<readonly FilterGroup[]>(
    () => [
      {
        key: "department",
        label: salesFr.list.department,
        anyLabel: salesFr.list.anyDepartment,
        value: scope.department,
        options: departmentOptions(filters.data),
        onChange: (value) => onScopeChange({ department: value, companyId: null }),
      },
    ],
    [scope.department, filters.data, onScopeChange],
  );

  const label = scope.department === null ? null : departmentLabel(scope.department);
  const isPending = companies.isPending || map.isPending;
  const error = companies.error ?? map.error;
  const isEmpty = companies.isSuccess && rows.length === 0 && scope.companyId === null;
  const emptyProps = { scope, onClearSearch: clearSearch, onClearDepartment: clearDepartment };

  return (
    <AdminPage section="commercial" layout="map" trail={TRAIL} mobileTitle={text.title}>
      <AdminHeading
        title={text.title}
        subtitle={
          count === null
            ? text.subtitleLoading
            : text.subtitle(
                scope.tab,
                count,
                scope.department === null ? null : departmentLocative(scope.department),
              )
        }
      />
      <div className="hidden lg:block">
        <ListToolbar
          search={scope.search}
          searchLabel={text.searchLabel}
          searchPlaceholder={text.searchPlaceholder}
          groups={groups}
          onSearchChange={changeSearch}
        >
          <ListTabs
            label={salesFr.list.tabsLabel}
            ids={PROSPECTION_TABS}
            mobileIds={PROSPECTION_TABS}
            labels={salesFr.stageTabs}
            counts={counts}
            active={scope.tab}
            onSelect={selectTab}
          />
        </ListToolbar>
      </div>
      {error === null ? (
        <div className="grid items-stretch gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div ref={measureList} className="hidden min-w-0 flex-col gap-3 self-start lg:flex">
            {companies.isPending ? <LeadListSkeleton /> : null}
            {isEmpty ? <ProspectionEmpty {...emptyProps} /> : null}
            {rows.length > 0 ? (
              <LeadList companies={rows} selectedId={selectedId} onSelect={select}>
                <CursorPagination
                  paging={paging}
                  nextCursor={companies.data?.nextCursor ?? null}
                  shown={rows.length}
                  total={search === "" ? count : null}
                  isLoading={companies.isPlaceholderData}
                />
              </LeadList>
            ) : null}
          </div>
          <ProspectMap
            pins={pins}
            selectedId={selectedId}
            fitKey={scope.department ?? "all"}
            description={text.mapDescription(label)}
            onSelect={select}
          >
            <MapSearch
              value={scope.search}
              placeholder={text.mobilePlaceholder(
                scope.tab,
                count,
                scope.department === null ? null : departmentName(scope.department),
              )}
              onChange={changeSearch}
            />
            {isPending ? <LeadCardSkeleton /> : null}
            {isPending ? <LeadSheetSkeleton /> : null}
            {!isPending && selectedId !== null ? (
              <LeadCard companyId={selectedId} onChanged={selectNext} />
            ) : null}
            {!isPending && selectedId !== null ? (
              <LeadSheet companyId={selectedId} onChanged={selectNext} />
            ) : null}
            {isEmpty ? <ProspectionSheetEmpty {...emptyProps} /> : null}
          </ProspectMap>
        </div>
      ) : (
        <div className="p-4 lg:p-0">
          <ErrorState error={error} onRetry={retry} />
        </div>
      )}
    </AdminPage>
  );
};
