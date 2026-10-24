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

export const SERVICES_WIDTH = "lg:max-w-[900px]";

const DESKTOP_GRID =
  "lg:grid lg:grid-cols-[minmax(0,1fr)_110px_110px_200px_24px] lg:items-center lg:gap-4";

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
  const duration = formatDuration(service.durationMinutes);
  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <ServiceIcon name={service.name} trade={service.trade} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-semibold lg:text-[13px]">{service.name}</span>
          <span className="truncate text-[13px] text-[#64748B] lg:hidden">
            {service.document === "none"
              ? text.shortSummary(duration, price)
              : text.summary(duration, price, document)}
          </span>
        </span>
      </span>
      <span className="hidden text-[13px] tabular-nums lg:block">{duration}</span>
      <span
        className={cn(
          "hidden text-[13px] tabular-nums lg:block",
          service.priceCents === null && "text-[#64748B]",
        )}
      >
        {price}
      </span>
      <span className="hidden truncate text-[13px] text-[#475569] lg:block">{document}</span>
      {canEdit ? (
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[#94A3B8]" />
      ) : (
        <span aria-hidden="true" className="hidden lg:block" />
      )}
    </>
  );
  const rowClass = cn(
    "flex min-h-16 w-full items-center gap-3 px-3.5 py-3 text-left lg:min-h-[52px] lg:py-2",
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
  <div className={cn(CARD_CLASS, SERVICES_WIDTH)}>
    <div
      aria-hidden="true"
      className={cn(
        "hidden border-b border-[#E3E8EF] bg-[#F7F9FB] px-3.5 py-2.5 text-[13px] font-semibold text-[#64748B]",
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
        <li key={service.id} className="border-t border-[#EEF2F6] first:border-t-0">
          <ServiceRow service={service} canEdit={canEdit} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  </div>
);
