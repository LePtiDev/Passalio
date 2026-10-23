import {
  Euro,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Timer,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { CARD_CLASS, fullAddressOf } from "@/contexts/customers";
import { cn } from "@/lib/utils";
import { formatDuration, formatEuros, schedulingFr, visitTypesLabel } from "../../fr";
import type { VisitFile } from "../../hooks/use-visit";

const text = schedulingFr.visit;

type InfoLine = {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: string | null;
};

export const VisitInfoCard = ({
  visit,
  technicianName,
}: {
  readonly visit: VisitFile;
  readonly technicianName: string;
}) => {
  const { customer, site, intervention } = visit;
  const lines: readonly InfoLine[] = [
    { icon: MapPin, label: text.address, value: site === null ? null : fullAddressOf(site) },
    { icon: KeyRound, label: text.access, value: site?.accessNotes ?? null },
    { icon: Phone, label: text.phone, value: customer?.phone ?? null },
    { icon: Mail, label: text.email, value: customer?.email ?? null },
    {
      icon: Euro,
      label: text.announcedPrice,
      value:
        intervention.announcedPriceCents === null
          ? null
          : formatEuros(intervention.announcedPriceCents),
    },
    {
      icon: Timer,
      label: text.visitType,
      value:
        intervention.visitTypes.length === 0
          ? null
          : text.typeAndDuration(
              visitTypesLabel(intervention.visitTypes),
              formatDuration(intervention.durationMinutes),
            ),
    },
    {
      icon: UserRound,
      label: text.technician,
      value: technicianName === "" ? null : technicianName,
    },
  ];
  return (
    <section className={cn(CARD_CLASS, "flex flex-col")}>
      <h2 className="px-3.5 pt-3.5 pb-1 text-[15px] font-bold lg:text-sm">{text.placeTitle}</h2>
      <dl className="flex flex-col">
        {lines.map(({ icon: Icon, label, value }) =>
          value === null ? null : (
            <div
              key={label}
              className="flex items-start gap-3 border-t border-[#EEF2F6] px-3.5 py-3 first:border-t-0"
            >
              <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#94A3B8]" />
              <div className="flex min-w-0 flex-col">
                <dt className="text-xs text-[#64748B]">{label}</dt>
                <dd className="text-[15px] break-words lg:text-[13px]">{value}</dd>
              </div>
            </div>
          ),
        )}
      </dl>
    </section>
  );
};
