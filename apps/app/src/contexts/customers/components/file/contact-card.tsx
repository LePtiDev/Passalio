import { Link } from "@tanstack/react-router";
import { BellRing, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import type { CustomerRecord, SiteRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { BUILDING_TYPE_LABELS, customersFr } from "../../fr";
import { useCustomerParams } from "../../hooks/use-route-params";
import { CARD_CLASS } from "../customer-styles";

const text = customersFr.file;

type ContactLine = {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: string;
  readonly isMuted: boolean;
};

const billingOf = (customer: CustomerRecord, firstSite: SiteRecord | undefined) => {
  if (customer.billingAddress !== null) {
    return [customer.billingAddress, customer.billingPostalCode, customer.billingCity]
      .filter((part) => part !== null)
      .join(" ");
  }
  if (firstSite === undefined) {
    return null;
  }
  return text.billingSameAs(firstSite.label ?? BUILDING_TYPE_LABELS[firstSite.buildingType]);
};

const remindersOf = (customer: CustomerRecord) => {
  if (customer.remindersOptedOutAt !== null) {
    return { value: text.remindersOff, isMuted: false };
  }
  return customer.email === null
    ? { value: text.remindersNeedEmail, isMuted: true }
    : { value: text.remindersByEmail, isMuted: false };
};

const linesOf = (customer: CustomerRecord, firstSite: SiteRecord | undefined): ContactLine[] => {
  const billing = billingOf(customer, firstSite);
  return [
    {
      icon: Phone,
      label: text.phone,
      value: customer.phone ?? text.notSet,
      isMuted: customer.phone === null,
    },
    {
      icon: Mail,
      label: text.email,
      value: customer.email ?? text.notSet,
      isMuted: customer.email === null,
    },
    { icon: MapPin, label: text.billing, value: billing ?? text.notSet, isMuted: billing === null },
    { icon: BellRing, label: text.reminders, ...remindersOf(customer) },
  ];
};

type ContactCardProps = {
  readonly customer: CustomerRecord;
  readonly firstSite: SiteRecord | undefined;
};

export const ContactCard = ({ customer, firstSite }: ContactCardProps) => {
  const params = useCustomerParams(customer.id);
  return (
    <section className={cn(CARD_CLASS, "flex flex-col")}>
      <div className="flex items-center justify-between gap-3 px-3.5 pt-2 pb-1 lg:pt-3">
        <h2 className="text-[15px] font-bold lg:text-sm">{text.contact}</h2>
        <Link
          to="/clients/$customerId/modifier"
          params={params}
          className="flex h-12 items-center text-[13px] font-semibold text-[#0E7C5A] lg:h-auto"
        >
          {text.edit}
        </Link>
      </div>
      <dl className="flex flex-col">
        {linesOf(customer, firstSite).map(({ icon: Icon, label, value, isMuted }) => (
          <div
            key={label}
            className="flex items-start gap-3 border-t border-[#EEF2F6] px-3.5 py-3 first:border-t-0"
          >
            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#94A3B8]" />
            <div className="flex min-w-0 flex-col">
              <dt className="text-xs text-[#64748B]">{label}</dt>
              <dd
                className={cn("truncate text-[15px] lg:text-[13px]", isMuted && "text-[#94A3B8]")}
              >
                {value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      {customer.notes === null ? null : (
        <div className="border-t border-[#EEF2F6] px-3.5 py-3">
          <span className="text-xs text-[#64748B]">{text.notes}</span>
          <p className="text-[15px] whitespace-pre-line lg:text-[13px]">{customer.notes}</p>
        </div>
      )}
    </section>
  );
};
