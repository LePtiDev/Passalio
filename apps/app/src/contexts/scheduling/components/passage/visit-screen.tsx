import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Ellipsis,
  FilePenLine,
  Navigation,
  Phone,
  StickyNote,
  UserRound,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/app-shell/page-bars";
import { InitialsAvatar } from "@/components/initials-avatar";
import { FormSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ConfirmDialog,
  customerNameOf,
  PRIMARY_BUTTON_CLASS,
  routeUrlOf,
  SECONDARY_BUTTON_CLASS,
  SOON_BADGE_CLASS,
  SyncPill,
} from "@/contexts/customers";
import { useLocalSession } from "@/lib/db/local-database-context";
import { cn } from "@/lib/utils";
import { assignedTechniciansOf } from "../../visit-team";
import { schedulingFr } from "../../fr";
import { cancelIntervention } from "../../intervention-store";
import { longDayLabel, parisMinutesOf, todayOf } from "../../planning-dates";
import { useNow } from "../../hooks/use-now";
import { useTechnicians } from "../../hooks/use-technicians";
import { useVisit, type VisitFile } from "../../hooks/use-visit";
import { VisitEquipments } from "./visit-equipments";
import { VisitInfoCard } from "./visit-info-card";
import { VisitNotFound } from "./visit-not-found";
import { visitStatusOf, type VisitStatus } from "./visit-status";

const text = schedulingFr.visit;

const STATUS_DOT: Readonly<Record<VisitStatus, string>> = {
  planned: "bg-[#64748B]",
  now: "bg-[#D97706]",
  completed: "bg-[#0E7C5A]",
  cancelled: "bg-[#B42318]",
};

const ActionTile = ({
  icon: Icon,
  label,
  href,
  to,
}: {
  readonly icon: typeof Phone;
  readonly label: string;
  readonly href?: string | undefined;
  readonly to?: { readonly customerId: string };
}) => {
  const className =
    "flex h-16 flex-col items-center justify-center gap-1 rounded-[12px] border border-[#E3E8EF] bg-white text-[13px] font-semibold";
  const content = (
    <>
      <Icon aria-hidden="true" className="size-5 text-[#0E7C5A]" />
      {label}
    </>
  );
  if (to !== undefined) {
    return (
      <Link to="/clients/$customerId" params={to} className={className}>
        {content}
      </Link>
    );
  }
  return href === undefined ? (
    <span aria-disabled="true" className={cn(className, "text-[#94A3B8]")}>
      {content}
    </span>
  ) : (
    <a
      href={href}
      target={href.startsWith("tel:") ? undefined : "_blank"}
      rel="noreferrer"
      className={className}
    >
      {content}
    </a>
  );
};

const CertificateButton = ({ className }: { readonly className: string }) => (
  <Button type="button" disabled className={cn(PRIMARY_BUTTON_CLASS, className)}>
    <FilePenLine aria-hidden="true" className="size-5 lg:size-3.5" />
    {text.fillCertificate}
    <span className={SOON_BADGE_CLASS}>{schedulingFr.visit.soon}</span>
  </Button>
);

const VisitBody = ({ visit }: { readonly visit: VisitFile }) => {
  const { database } = useLocalSession();
  const navigate = useNavigate();
  const team = useTechnicians();
  const now = useNow();
  const [isConfirming, setIsConfirming] = useState(false);
  const { intervention, customer, site } = visit;
  const name = customer === null ? "" : customerNameOf(customer);
  const status = visitStatusOf(intervention, todayOf(now), parisMinutesOf(now));
  const technicianNames = assignedTechniciansOf(intervention).flatMap(
    (technicianId) => team?.technicians.find(({ userId }) => userId === technicianId)?.name ?? [],
  );
  const when = [longDayLabel(intervention.scheduledDate), intervention.startTime]
    .filter((part) => part !== null)
    .join(" · ");
  const phoneHref =
    customer?.phone === null || customer === null
      ? undefined
      : `tel:${customer.phone.replaceAll(" ", "")}`;
  const routeHref = site === null ? undefined : routeUrlOf(site);
  const canCancel = team?.canPlan === true && intervention.status === "planned";
  const day = intervention.scheduledDate;
  const interventionId = intervention.id;
  const confirmCancel = useCallback(() => {
    const run = async () => {
      try {
        await cancelIntervention(database, interventionId);
        toast.success(text.cancelled);
        await navigate({ to: "/planning", search: { jour: day } });
      } catch {
        toast.error(text.cancelFailed);
      }
    };
    void run();
  }, [database, interventionId, navigate, day]);
  const askCancel = useCallback(() => setIsConfirming(true), []);
  const trail = useMemo(() => [{ label: schedulingFr.planning.title }, { label: name }], [name]);
  const backSearch = useMemo(() => ({ jour: day }), [day]);
  const customerLink = useMemo(
    () => (customer === null ? null : { customerId: customer.id }),
    [customer],
  );
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#F7F9FB] pb-[100px] lg:bg-white lg:pb-0">
      <DesktopTopBar trail={trail}>
        <SyncPill />
      </DesktopTopBar>
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-2 border-b border-[#E3E8EF] bg-white px-3 py-2 lg:hidden">
        <Link
          to="/planning"
          search={backSearch}
          aria-label={text.back}
          className="-ml-1 flex size-12 shrink-0 items-center justify-center rounded-xl"
        >
          <ChevronLeft aria-hidden="true" className="size-[22px]" />
        </Link>
        <span className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-[17px] font-bold">{text.title(intervention.startTime)}</h1>
          <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
            <span aria-hidden="true" className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
            {text.status[status]}
            {visit.isPending ? ` · ${schedulingFr.planning.toSend.toLowerCase()}` : null}
          </span>
        </span>
        {canCancel ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={text.actions}
              className="flex size-12 shrink-0 items-center justify-center rounded-xl"
            >
              <Ellipsis aria-hidden="true" className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" className="min-h-12" onSelect={askCancel}>
                {text.cancel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>
      <div className="flex w-full flex-col gap-4 p-4 lg:gap-5 lg:p-6">
        <div className="hidden flex-wrap items-center justify-between gap-4 lg:flex">
          <div className="flex items-center gap-3">
            <InitialsAvatar name={name} tone="slate" size="large" />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-[-0.015em]">{name}</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF3F8] px-2 py-0.5 text-xs font-semibold">
                  <span
                    aria-hidden="true"
                    className={cn("size-1.5 rounded-full", STATUS_DOT[status])}
                  />
                  {text.status[status]}
                </span>
              </div>
              <p className="text-[13px] text-[#475569]">
                {text.subtitle(when, technicianNames.join(", "), intervention.equipmentIds.length)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phoneHref === undefined ? null : (
              <Button asChild variant="outline" className={SECONDARY_BUTTON_CLASS}>
                <a href={phoneHref}>
                  <Phone aria-hidden="true" className="size-3.5" />
                  {text.call}
                </a>
              </Button>
            )}
            {routeHref === undefined ? null : (
              <Button asChild variant="outline" className={SECONDARY_BUTTON_CLASS}>
                <a href={routeHref} target="_blank" rel="noreferrer">
                  <Navigation aria-hidden="true" className="size-3.5" />
                  {text.route}
                </a>
              </Button>
            )}
            {canCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={askCancel}
                className={SECONDARY_BUTTON_CLASS}
              >
                {text.cancel}
              </Button>
            ) : null}
            <CertificateButton className="" />
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:hidden">
          <div className="flex items-center gap-3">
            <InitialsAvatar name={name} tone="slate" size="large" />
            <div className="flex min-w-0 flex-col">
              <span className="text-xl font-bold">{name}</span>
              <span className="truncate text-[13px] text-[#64748B]">
                {[intervention.startTime, site?.address ?? null, site?.city ?? null]
                  .filter((part) => part !== null)
                  .join(" · ")}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ActionTile icon={Phone} label={text.call} href={phoneHref} />
            <ActionTile icon={Navigation} label={text.route} href={routeHref} />
            {customerLink === null ? null : (
              <ActionTile icon={UserRound} label={text.customerFile} to={customerLink} />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-5">
          <div className="flex flex-col gap-3">
            <VisitEquipments equipments={visit.equipments} documents={visit.documents} />
            {intervention.notes === null ? null : (
              <p className="flex items-start gap-3 rounded-[12px] bg-[#F7F9FB] px-3.5 py-3 text-[13px] text-[#475569] lg:rounded-lg">
                <StickyNote aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#94A3B8]" />
                <span>
                  <b className="font-semibold text-[#0F2A44]">{text.note}</b> {intervention.notes}
                </span>
              </p>
            )}
          </div>
          <VisitInfoCard visit={visit} technicianNames={technicianNames} />
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-[#E3E8EF] bg-white px-4 pt-3 pb-[max(18px,env(safe-area-inset-bottom))] lg:hidden">
        <CertificateButton className="w-full" />
      </div>
      <ConfirmDialog
        isOpen={isConfirming}
        title={text.cancelTitle}
        description={text.cancelText}
        confirmLabel={text.confirmCancel}
        onOpenChange={setIsConfirming}
        onConfirm={confirmCancel}
      />
    </div>
  );
};

export const VisitScreen = ({ interventionId }: { readonly interventionId: string }) => {
  const visit = useVisit(interventionId);
  if (visit === undefined) {
    return (
      <div className="mx-auto w-full max-w-[600px] p-4 lg:py-8">
        <FormSkeleton />
      </div>
    );
  }
  return visit === null || visit.intervention.status === "cancelled" ? (
    <VisitNotFound />
  ) : (
    <VisitBody visit={visit} />
  );
};
