import type { TradeId } from "@passalio/trades";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { DASHED_CARD_CLASS, SyncPill } from "@/contexts/customers";
import { useOrganization } from "@/contexts/identity";
import { DesktopTopBar, MobileTopBar, PageContent } from "@/components/app-shell/page-bars";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServiceRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import { useServiceSettings } from "../../hooks/use-service-settings";
import {
  NEW_SERVICE_FORM,
  serviceFormOf,
  toServiceFields,
  type ServiceFormValues,
} from "../../service-form-schema";
import { ServiceEditor } from "./service-editor";
import { ServiceRows, SERVICES_WIDTH } from "./service-rows";

const text = schedulingFr.services;

const TRAIL = [{ label: text.settings, to: "/reglages" }, { label: text.title }] as const;

const NO_SERVICES: readonly ServiceRecord[] = [];

const NO_TRADES: readonly TradeId[] = [];

const SKELETON_ROWS = ["first", "second", "third", "fourth"] as const;

const NEW_SERVICE = "new";

const ServicesSkeleton = () => (
  <ul
    aria-busy="true"
    aria-label={text.loading}
    className={cn(
      "overflow-hidden rounded-[14px] border border-[#E3E8EF] bg-white lg:rounded-xl",
      SERVICES_WIDTH,
    )}
  >
    {SKELETON_ROWS.map((row) => (
      <li
        key={row}
        className="flex min-h-16 items-center gap-3 border-t border-[#EEF2F6] px-3.5 first:border-t-0 lg:min-h-[52px]"
      >
        <Skeleton className="size-9 rounded-full lg:size-8" />
        <span className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center lg:gap-16">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3.5 w-36 lg:w-16" />
          <Skeleton className="hidden h-3.5 w-16 lg:block" />
          <Skeleton className="hidden h-3.5 w-32 lg:block" />
        </span>
      </li>
    ))}
  </ul>
);

const EmptyServices = ({
  canEdit,
  canAddDefaults,
  isAddingDefaults,
  onAddDefaults,
  onCreate,
}: {
  readonly canEdit: boolean;
  readonly canAddDefaults: boolean;
  readonly isAddingDefaults: boolean;
  readonly onAddDefaults: () => void;
  readonly onCreate: () => void;
}) => (
  <div className={cn(DASHED_CARD_CLASS, "items-start", SERVICES_WIDTH)}>
    <span className="flex flex-col gap-1">
      <span className="text-[15px] font-semibold lg:text-sm">{text.emptyTitle}</span>
      <span className="text-sm text-[#64748B] lg:text-[13px]">
        {canEdit ? text.emptyText : text.readOnly}
      </span>
    </span>
    {canEdit ? (
      <span className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row">
        {canAddDefaults ? (
          <Button
            type="button"
            onClick={onAddDefaults}
            disabled={isAddingDefaults}
            className="w-full lg:w-auto"
          >
            {text.addDefaults}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" onClick={onCreate} className="w-full lg:w-auto">
          <Plus aria-hidden="true" className="size-4" />
          {text.add}
        </Button>
      </span>
    ) : null}
  </div>
);

export const ServicesScreen = () => {
  const { query, save, archive, addDefaults, canEdit } = useServiceSettings();
  const organization = useOrganization();
  const [openId, setOpenId] = useState<string | null>(null);
  const services = query.data ?? NO_SERVICES;
  const opened = services.find(({ id }) => id === openId) ?? null;
  const trades = organization.data?.trades ?? NO_TRADES;
  const close = useCallback(() => {
    setOpenId(null);
    save.reset();
  }, [save]);
  const create = useCallback(() => setOpenId(NEW_SERVICE), []);
  const saveOpened = useCallback(
    (values: ServiceFormValues) => {
      save.mutate(
        {
          serviceId: opened?.id ?? null,
          fields: toServiceFields(values, opened?.trade ?? null),
        },
        { onSuccess: () => setOpenId(null) },
      );
    },
    [save, opened],
  );
  const archiveOpened = useCallback(() => {
    if (opened !== null) {
      archive.mutate(opened.id, { onSuccess: () => setOpenId(null) });
    }
  }, [archive, opened]);
  const addTradeDefaults = useCallback(() => addDefaults.mutate(trades), [addDefaults, trades]);
  const retryLoad = useCallback(() => void query.refetch(), [query]);
  const addButton = canEdit ? (
    <Button type="button" onClick={create}>
      <Plus aria-hidden="true" className="size-3.5" />
      {text.add}
    </Button>
  ) : null;

  return (
    <>
      <DesktopTopBar trail={TRAIL}>
        <SyncPill />
      </DesktopTopBar>
      <MobileTopBar backTo="/reglages" backLabel={text.backToSettings}>
        <span className="flex flex-1 flex-col">
          <h1 className="text-[17px] font-bold">{text.title}</h1>
          <span className="text-[13px] text-[#64748B]">{text.subtitle}</span>
        </span>
        {canEdit ? (
          <Button type="button" onClick={create} aria-label={text.add} size="icon">
            <Plus aria-hidden="true" className="size-5" />
          </Button>
        ) : null}
      </MobileTopBar>
      <PageContent>
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="hidden text-xl font-bold tracking-[-0.015em] lg:block">{text.title}</h1>
            <p className="text-[15px] text-[#475569] lg:text-[13px]">{text.intro}</p>
          </div>
          <span className="hidden shrink-0 lg:block">{addButton}</span>
        </div>
        {query.isPending ? <ServicesSkeleton /> : null}
        {query.isError ? (
          <div className={SERVICES_WIDTH}>
            <ErrorState error={query.error} message={text.loadFailed} onRetry={retryLoad} />
          </div>
        ) : null}
        {query.isSuccess && services.length === 0 ? (
          <EmptyServices
            canEdit={canEdit}
            canAddDefaults={trades.length > 0}
            isAddingDefaults={addDefaults.isPending}
            onAddDefaults={addTradeDefaults}
            onCreate={create}
          />
        ) : null}
        {services.length > 0 ? (
          <>
            <ServiceRows services={services} canEdit={canEdit} onOpen={setOpenId} />
            <p className={cn("text-[13px] text-[#64748B]", SERVICES_WIDTH)}>{text.footnote}</p>
          </>
        ) : null}
      </PageContent>
      <ServiceEditor
        isOpen={openId === NEW_SERVICE || opened !== null}
        formKey={openId ?? NEW_SERVICE}
        initial={opened === null ? NEW_SERVICE_FORM : serviceFormOf(opened)}
        isExisting={opened !== null}
        isSaving={save.isPending}
        isArchiving={archive.isPending}
        saveError={save.isError ? save.error : null}
        onSave={saveOpened}
        onArchive={archiveOpened}
        onClose={close}
      />
    </>
  );
};
