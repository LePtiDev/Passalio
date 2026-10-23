import type { ProspectCompanySummaryResponse, ProspectContactResponse } from "@passalio/shared";
import { Briefcase, ChevronRight, Clock, Mail, Pencil, Phone, Smartphone } from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { ADMIN_CARD_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from "@/contexts/backoffice";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { CompanyLink } from "../record-links";
import { NEUTRAL_BADGE_CLASS } from "../sales-styles";
import { StageLabel } from "../stage-label";
import { CallLink, SECONDARY_ACTION_CLASS } from "./file-actions";
import { InfoCard, type InfoItem } from "./info-card";

const text = salesFr.file;

export const roleOf = (contact: ProspectContactResponse) =>
  contact.jobTitle ?? (contact.isLeader ? salesFr.contacts.leader : null);

const placeOf = (company: ProspectCompanySummaryResponse) =>
  company.city === null ? company.department : `${company.city} (${company.department})`;

type ContactHeaderProps = {
  readonly contact: ProspectContactResponse;
  readonly company: ProspectCompanySummaryResponse;
  readonly onEdit: () => void;
};

export const ContactFileHeader = ({ contact, company, onEdit }: ContactHeaderProps) => {
  const role = roleOf(contact);
  const phone = contact.phone ?? contact.mobile ?? company.phone;
  return (
    <>
      <div className="hidden flex-wrap items-center justify-between gap-4 lg:flex">
        <div className="flex min-w-0 items-center gap-3">
          <InitialsAvatar name={contact.name} tone="mint" size="profile" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl leading-tight font-bold tracking-[-0.015em]">
                {contact.name}
              </h1>
              {role === null ? null : <span className={NEUTRAL_BADGE_CLASS}>{role}</span>}
            </div>
            <p className="text-[13px] text-[#475569]">
              {company.name} · {placeOf(company)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <CallLink phone={phone} className={SECONDARY_ACTION_CLASS} />
          <Button variant="outline" className={SECONDARY_ACTION_CLASS} onClick={onEdit}>
            <Pencil aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
            {text.edit}
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="flex items-center gap-3">
          <InitialsAvatar name={contact.name} tone="mint" size="profile" />
          <span className="flex min-w-0 flex-col">
            <h2 className="text-xl leading-tight font-bold">{contact.name}</h2>
            <span className="truncate text-[13px] text-[#64748B]">
              {[role, company.name].filter((part) => part !== null).join(" · ")}
            </span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CallLink
            phone={phone}
            className={cn(buttonVariants(), ADMIN_PRIMARY_BUTTON_CLASS, "gap-2")}
          />
          <Button variant="outline" className={SECONDARY_ACTION_CLASS} onClick={onEdit}>
            {text.edit}
          </Button>
        </div>
      </div>
    </>
  );
};

export const ContactCompanyCard = ({
  company,
}: {
  readonly company: ProspectCompanySummaryResponse;
}) => (
  <CompanyLink
    id={company.id}
    className={cn(
      ADMIN_CARD_CLASS,
      "grid min-h-16 grid-cols-[minmax(0,1fr)_18px] items-center gap-3 px-3.5 py-2 hover:bg-[#F7F9FB] lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_auto_24px] lg:gap-4 lg:py-3",
    )}
  >
    <span className="flex min-w-0 items-center gap-3">
      <InitialsAvatar name={company.name} tone="amber" size="medium" />
      <span className="flex min-w-0 flex-col gap-px">
        <span className="truncate text-[15px] font-semibold lg:text-[13px]">{company.name}</span>
        <span className="truncate text-[13px] text-[#64748B]">
          <span className="lg:hidden">
            {[company.city, salesFr.stages[company.stage]]
              .filter((part) => part !== null)
              .join(" · ")}
          </span>
          <span className="hidden lg:inline">{placeOf(company)}</span>
        </span>
      </span>
    </span>
    <StageLabel stage={company.stage} className="hidden text-[13px] lg:inline-flex" />
    <ChevronRight aria-hidden="true" className="size-[18px] text-[#94A3B8] lg:size-4" />
  </CompanyLink>
);

const detailsOf = (contact: ProspectContactResponse): readonly InfoItem[] => [
  {
    key: "phone",
    label: text.fields.phone,
    icon: Phone,
    value: contact.phone,
    missing: text.missing.phone,
  },
  {
    key: "mobile",
    label: text.fields.mobile,
    icon: Smartphone,
    value: contact.mobile,
    missing: text.missing.mobile,
  },
  {
    key: "email",
    label: text.fields.email,
    icon: Mail,
    value: contact.email,
    missing: text.missing.email,
  },
  {
    key: "jobTitle",
    label: text.fields.jobTitle,
    icon: Briefcase,
    value: roleOf(contact),
    missing: text.missing.jobTitle,
    isMobileHidden: true,
  },
  {
    key: "bestTime",
    label: text.fields.bestTime,
    icon: Clock,
    value: contact.bestTime,
    missing: text.missing.bestTime,
  },
];

export const ContactDetails = ({ contact }: { readonly contact: ProspectContactResponse }) => (
  <InfoCard title={text.details} items={detailsOf(contact)} />
);
