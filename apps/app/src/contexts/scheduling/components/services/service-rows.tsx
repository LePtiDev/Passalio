import { ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { CARD_CLASS } from "@/contexts/customers";
import type { ServiceRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  formatServicePrice,
  schedulingFr,
  SERVICE_DOCUMENT_LABELS,
} from "../../fr";
import { ServiceIcon } from "./service-icon";

const text = schedulingFr.services;

const DESKTOP_GRID = "lg:grid lg:grid-cols-[minmax(0,2.4fr)_1fr_1fr_1.6fr_20px] lg:gap-4";

const ServiceRow = ({
  service,
  canEdit,
  onOpen,
}: {
  readonly service: ServiceRecord;
  readonly canEdit: boolean;
  readonly onOpen: (serviceId: string) => void;
}) => {
  const open = useCallback(() => onOpen(service.id), [onOpen, service.id]);
  const price = formatServicePrice(service.priceCents);
  const document = SERVICE_DOCUMENT_LABELS[service.document];
  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <ServiceIcon trade={service.trade} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-base font-semibold lg:text-sm">{service.name}</span>
          <span className="text-sm text-[#64748B] lg:hidden">
            {text.summary(formatDuration(service.durationMinutes), price, document)}
          </span>
        </span>
      </span>
      <span className="hidden text-sm lg:block">{formatDuration(service.durationMinutes)}</span>
      <span
        className={cn("hidden text-sm lg:block", service.priceCents === null && "text-[#64748B]")}
      >
        {price}
      </span>
      <span className="hidden text-sm lg:block">{document}</span>
      {canEdit ? (
        <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-[#94A3B8]" />
      ) : (
        <span aria-hidden="true" className="hidden lg:block" />
      )}
    </>
  );
  const rowClass = cn(
    "flex min-h-[68px] w-full items-center gap-3 px-3.5 py-3 text-left lg:min-h-[60px] lg:items-center lg:px-4",
    DESKTOP_GRID,
  );
  return canEdit ? (
    <button
      type="button"
      onClick={open}
      aria-label={text.open(service.name)}
      className={cn(rowClass, "hover:bg-[#F7F9FB]")}
    >
      {content}
    </button>
  ) : (
    <div className={rowClass}>{content}</div>
  );
};

export const ServiceRows = ({
  services,
  canEdit,
  onOpen,
}: {
  readonly services: readonly ServiceRecord[];
  readonly canEdit: boolean;
  readonly onOpen: (serviceId: string) => void;
}) => (
  <div className={cn(CARD_CLASS, "lg:max-w-[860px]")}>
    <div
      aria-hidden="true"
      className={cn(
        "hidden border-b border-[#EEF2F6] bg-[#F7F9FB] px-4 py-2.5 text-[13px] font-medium text-[#64748B]",
        DESKTOP_GRID,
      )}
    >
      <span>{text.columns.name}</span>
      <span>{text.columns.duration}</span>
      <span>{text.columns.price}</span>
      <span>{text.columns.document}</span>
      <span />
    </div>
    <ul>
      {services.map((service) => (
        <li key={service.id} className="border-b border-[#EEF2F6] last:border-b-0">
          <ServiceRow service={service} canEdit={canEdit} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  </div>
);
