import { Link } from "@tanstack/react-router";
import {
  Euro,
  Flame,
  MapPin,
  Navigation,
  StickyNote,
  Timer,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import {
  fullAddressOf,
  PRIMARY_BUTTON_CLASS,
  routeUrlOf,
  SECONDARY_BUTTON_CLASS,
} from "@/contexts/customers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatEuros, schedulingFr, visitTypesLabel } from "../../fr";
import { longDayLabel } from "../../planning-dates";
import type { PlanningVisit } from "../../planning-visits";
import { visitTimeRange } from "./visit-block";

const text = schedulingFr.panel;

const Fact = ({
  icon: Icon,
  children,
}: {
  readonly icon: LucideIcon;
  readonly children: ReactNode;
}) => (
  <div className="flex items-start gap-2.5">
    <dt className="mt-0.5 text-[#94A3B8]">
      <Icon aria-hidden="true" className="size-3.5" />
    </dt>
    <dd>{children}</dd>
  </div>
);

export const VisitPanel = ({
  visit,
  onClose,
}: {
  readonly visit: PlanningVisit;
  readonly onClose: () => void;
}) => {
  const { intervention, site } = visit;
  const range = visitTimeRange(visit);
  const params = useMemo(() => ({ interventionId: visit.id }), [visit.id]);
  return (
    <aside
      aria-label={text.title}
      className="flex w-[300px] shrink-0 flex-col gap-4 border-l border-[#EEF2F6] px-5 py-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-[0.04em] text-[#64748B] uppercase">
          {text.title}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={text.close}
          className="-mr-2 flex size-8 items-center justify-center rounded-[7px] text-[#64748B] hover:bg-[#F1F5F9]"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-bold">{visit.customerName}</span>
        <span className="text-[13px] text-[#475569]">
          {[longDayLabel(intervention.scheduledDate), range]
            .filter((part) => part !== null)
            .join(" · ")}
        </span>
      </div>
      <dl className="flex flex-col gap-3 text-[13px]">
        {intervention.visitTypes.length === 0 ? null : (
          <Fact icon={Timer}>{visitTypesLabel(intervention.visitTypes)}</Fact>
        )}
        {site === null ? null : <Fact icon={MapPin}>{fullAddressOf(site)}</Fact>}
        {visit.equipmentNames.length === 0 ? null : (
          <Fact icon={Flame}>{visit.equipmentNames.join(", ")}</Fact>
        )}
        {intervention.announcedPriceCents === null ? null : (
          <Fact icon={Euro}>{text.announced(formatEuros(intervention.announcedPriceCents))}</Fact>
        )}
        {intervention.notes === null ? null : <Fact icon={StickyNote}>{intervention.notes}</Fact>}
      </dl>
      <div className="flex flex-col gap-2 pt-1">
        <Button asChild className={cn(PRIMARY_BUTTON_CLASS, "w-full")}>
          <Link to="/passages/$interventionId" params={params}>
            {text.open}
          </Link>
        </Button>
        {site === null ? null : (
          <Button asChild variant="outline" className={cn(SECONDARY_BUTTON_CLASS, "w-full")}>
            <a href={routeUrlOf(site)} target="_blank" rel="noreferrer">
              <Navigation aria-hidden="true" className="size-3.5" />
              {text.route}
            </a>
          </Button>
        )}
      </div>
    </aside>
  );
};
