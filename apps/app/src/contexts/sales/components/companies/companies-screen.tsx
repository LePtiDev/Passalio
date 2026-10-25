import { PROSPECT_STAGES, type ProspectStage } from "@passalio/shared";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  ADMIN_CARD_CLASS,
  AdminHeading,
  AdminPage,
  type AdminTrailStep,
} from "@/contexts/backoffice";
import { CursorPagination } from "@/components/pagination";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { usePagedList } from "@/lib/use-paged-list";
import { cn } from "@/lib/utils";
import { departmentLabel } from "../../department-names";
import { salesFr } from "../../fr";
import { useCompaniesPage, useProspectFilters } from "../../hooks/use-sales-queries";
import type { CompanyListScope } from "../../sales-api";
import { CompanyFormDialog } from "../forms/company-form-dialog";
import { ListTabs } from "../list/list-tabs";
import { ListSkeleton } from "../list/list-states";
import { ListToolbar } from "../list/list-toolbar";
import { LIST_HEADER_CLASS } from "../sales-styles";
import {
  MOBILE_STAGE_TABS,
  useCompanyFilterGroups,
  type CompanyListChanges,
} from "./company-list-filters";
import { COMPANY_GRID_CLASS, CompanyRow } from "./company-row";
import { CompaniesEmpty } from "./companies-states";

const text = salesFr.companies;

const SEARCH_DELAY_MS = 300;

const COMPANY_ROW_HEIGHTS = { mobile: 73, desktop: 55 } as const;

const TRAIL: readonly AdminTrailStep[] = [{ label: text.title }];

const TAB_IDS = ["all", ...PROSPECT_STAGES] as const;

type StageTab = (typeof TAB_IDS)[number];

const stageOfTab = (tab: StageTab): ProspectStage | null => (tab === "all" ? null : tab);

const CompaniesHeader = () => (
  <div aria-hidden="true" className={cn(COMPANY_GRID_CLASS, LIST_HEADER_CLASS)}>
    <span>{text.columns.company}</span>
    <span>{text.columns.mainContact}</span>
    <span>{text.columns.phone}</span>
    <span>{text.columns.stage}</span>
    <span>{text.columns.owner}</span>
    <span />
  </div>
);

type CompaniesScreenProps = {
  readonly scope: CompanyListScope;
  readonly onScopeChange: (changes: CompanyListChanges) => void;
};

export const CompaniesScreen = ({ scope, onScopeChange }: CompaniesScreenProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const debouncedSearch = useDebouncedValue(scope.search.trim(), SEARCH_DELAY_MS);
  const debouncedScope = useMemo(
    () => ({ ...scope, search: debouncedSearch }),
    [scope, debouncedSearch],
  );
  const { measureList, ...paging } = usePagedList(
    JSON.stringify(debouncedScope),
    COMPANY_ROW_HEIGHTS,
  );
  const companies = useCompaniesPage(debouncedScope, paging.cursor, paging.pageSize);
  const filters = useProspectFilters();
  const groups = useCompanyFilterGroups(scope, filters.data, onScopeChange);
  const { refetch } = companies;
  const retry = useCallback(() => void refetch(), [refetch]);
  const selectTab = useCallback(
    (tab: StageTab) => onScopeChange({ stage: stageOfTab(tab) }),
    [onScopeChange],
  );
  const changeSearch = useCallback((search: string) => onScopeChange({ search }), [onScopeChange]);
  const clearSearch = useCallback(() => onScopeChange({ search: "" }), [onScopeChange]);
  const clearFilters = useCallback(
    () => onScopeChange({ stage: null, department: null, owner: null }),
    [onScopeChange],
  );
  const openCreate = useCallback(() => setIsCreating(true), []);
  const mobileAction = useMemo(
    () => (
      <Button aria-label={text.create} size="icon" onClick={openCreate}>
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.2} />
      </Button>
    ),
    [openCreate],
  );
  const rows = companies.data?.companies ?? [];
  const counts = companies.data?.counts ?? null;
  const totals = filters.data?.totals ?? null;
  const shownCount = counts === null ? null : counts[scope.stage ?? "all"];
  const department = scope.department === null ? null : departmentLabel(scope.department);

  return (
    <AdminPage
      section="commercial"
      trail={TRAIL}
      mobileTitle={text.title}
      mobileSubtitle={shownCount === null ? undefined : text.mobileSubtitle(shownCount, department)}
      mobileAction={mobileAction}
    >
      <AdminHeading
        title={text.title}
        subtitle={
          totals === null ? text.subtitleLoading : text.subtitle(totals.companies, totals.contacts)
        }
      >
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" strokeWidth={2.2} />
          {text.create}
        </Button>
      </AdminHeading>
      <ListToolbar
        search={scope.search}
        searchLabel={text.searchLabel}
        searchPlaceholder={text.searchPlaceholder}
        groups={groups}
        onSearchChange={changeSearch}
      >
        <ListTabs
          label={salesFr.list.tabsLabel}
          ids={TAB_IDS}
          mobileIds={MOBILE_STAGE_TABS}
          labels={salesFr.stageTabs}
          counts={counts}
          active={scope.stage ?? "all"}
          onSelect={selectTab}
        />
      </ListToolbar>
      <div ref={measureList} className="flex flex-col gap-4 lg:gap-5">
        {companies.isPending ? <ListSkeleton /> : null}
        {companies.isError ? <ErrorState error={companies.error} onRetry={retry} /> : null}
        {companies.isSuccess && rows.length === 0 ? (
          <CompaniesEmpty
            scope={debouncedScope}
            onClearSearch={clearSearch}
            onClearFilters={clearFilters}
            onCreate={openCreate}
          />
        ) : null}
        {companies.isSuccess && rows.length > 0 ? (
          <>
            <div className={ADMIN_CARD_CLASS}>
              <CompaniesHeader />
              <ul>
                {rows.map((company) => (
                  <CompanyRow key={company.id} company={company} />
                ))}
              </ul>
              <CursorPagination
                paging={paging}
                nextCursor={companies.data?.nextCursor ?? null}
                shown={rows.length}
                total={debouncedScope.search === "" ? shownCount : null}
                isLoading={companies.isPlaceholderData}
              />
            </div>
          </>
        ) : null}
      </div>
      <CompanyFormDialog company={null} isOpen={isCreating} onOpenChange={setIsCreating} />
    </AdminPage>
  );
};
