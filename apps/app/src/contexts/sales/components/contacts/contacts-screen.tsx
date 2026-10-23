import { CONTACT_FILTERS, type ContactFilter } from "@passalio/shared";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
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
import { useContactsPage, useProspectFilters } from "../../hooks/use-sales-queries";
import type { ContactListScope } from "../../sales-api";
import { departmentOptions } from "../companies/company-list-filters";
import { ContactFormDialog } from "../forms/contact-form-dialog";
import type { FilterGroup } from "../list/list-filters";
import { ListTabs } from "../list/list-tabs";
import { ListSkeleton } from "../list/list-states";
import { ListToolbar } from "../list/list-toolbar";
import { LIST_HEADER_CLASS } from "../sales-styles";
import { CONTACT_GRID_CLASS, ContactRow } from "./contact-row";
import { ContactsEmpty } from "./contacts-states";

const text = salesFr.contacts;

const SEARCH_DELAY_MS = 300;

const CONTACT_ROW_HEIGHTS = { mobile: 73, desktop: 55 } as const;

const TRAIL: readonly AdminTrailStep[] = [{ label: text.title }];

const ContactsHeader = () => (
  <div aria-hidden="true" className={cn(CONTACT_GRID_CLASS, LIST_HEADER_CLASS)}>
    <span>{text.columns.contact}</span>
    <span>{text.columns.company}</span>
    <span>{text.columns.phone}</span>
    <span>{text.columns.email}</span>
    <span />
  </div>
);

type ContactsScreenProps = {
  readonly scope: ContactListScope;
  readonly onScopeChange: (changes: Partial<ContactListScope>) => void;
};

export const ContactsScreen = ({ scope, onScopeChange }: ContactsScreenProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const debouncedSearch = useDebouncedValue(scope.search.trim(), SEARCH_DELAY_MS);
  const debouncedScope = useMemo(
    () => ({ ...scope, search: debouncedSearch }),
    [scope, debouncedSearch],
  );
  const { measureList, ...paging } = usePagedList(
    JSON.stringify(debouncedScope),
    CONTACT_ROW_HEIGHTS,
  );
  const contacts = useContactsPage(debouncedScope, paging.cursor, paging.pageSize);
  const filters = useProspectFilters();
  const groups = useMemo<readonly FilterGroup[]>(
    () => [
      {
        key: "department",
        label: salesFr.list.department,
        anyLabel: salesFr.list.anyDepartment,
        value: scope.department,
        options: departmentOptions(filters.data),
        onChange: (value) => onScopeChange({ department: value }),
      },
    ],
    [scope.department, filters.data, onScopeChange],
  );
  const { refetch } = contacts;
  const retry = useCallback(() => void refetch(), [refetch]);
  const selectTab = useCallback(
    (filter: ContactFilter) => onScopeChange({ filter }),
    [onScopeChange],
  );
  const changeSearch = useCallback((search: string) => onScopeChange({ search }), [onScopeChange]);
  const clearSearch = useCallback(() => onScopeChange({ search: "" }), [onScopeChange]);
  const clearFilters = useCallback(
    () => onScopeChange({ filter: "all", department: null }),
    [onScopeChange],
  );
  const openCreate = useCallback(() => setIsCreating(true), []);
  const mobileAction = useMemo(
    () => (
      <Button aria-label={text.create} className="size-12 shrink-0 rounded-xl" onClick={openCreate}>
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.2} />
      </Button>
    ),
    [openCreate],
  );
  const rows = contacts.data?.contacts ?? [];
  const counts = contacts.data?.counts ?? null;
  const totals = filters.data?.totals ?? null;
  const department = scope.department === null ? null : departmentLabel(scope.department);

  return (
    <AdminPage
      section="commercial"
      trail={TRAIL}
      mobileTitle={text.title}
      mobileSubtitle={
        counts === null ? undefined : text.mobileSubtitle(counts[scope.filter], department)
      }
      mobileAction={mobileAction}
    >
      <AdminHeading
        title={text.title}
        subtitle={
          totals === null ? text.subtitleLoading : text.subtitle(totals.contacts, totals.companies)
        }
      >
        <Button className={ADMIN_PRIMARY_BUTTON_CLASS} onClick={openCreate}>
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
          label={text.title}
          ids={CONTACT_FILTERS}
          mobileIds={CONTACT_FILTERS}
          labels={text.tabs}
          counts={counts}
          active={scope.filter}
          onSelect={selectTab}
        />
      </ListToolbar>
      <div ref={measureList} className="flex flex-col gap-4 lg:gap-5">
        {contacts.isPending ? <ListSkeleton /> : null}
        {contacts.isError ? <ErrorState error={contacts.error} onRetry={retry} /> : null}
        {contacts.isSuccess && rows.length === 0 ? (
          <ContactsEmpty
            scope={debouncedScope}
            onClearSearch={clearSearch}
            onClearFilters={clearFilters}
          />
        ) : null}
        {contacts.isSuccess && rows.length > 0 ? (
          <>
            <div className={ADMIN_CARD_CLASS}>
              <ContactsHeader />
              <ul>
                {rows.map((contact, index) => (
                  <ContactRow key={contact.id} contact={contact} index={index} />
                ))}
              </ul>
              <CursorPagination
                paging={paging}
                nextCursor={contacts.data?.nextCursor ?? null}
                shown={rows.length}
                total={
                  debouncedScope.search === "" && counts !== null ? counts[scope.filter] : null
                }
                isLoading={contacts.isPlaceholderData}
              />
            </div>
          </>
        ) : null}
      </div>
      <ContactFormDialog
        companyId={null}
        contact={null}
        isOpen={isCreating}
        onOpenChange={setIsCreating}
      />
    </AdminPage>
  );
};
