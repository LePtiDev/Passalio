import type { ProspectCompanyResponse } from "@passalio/shared";
import { AlignLeft, File, House, Globe, Mail, MapPin, Phone, User } from "lucide-react";
import { ADMIN_CARD_CLASS } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { MUTED_CLASS } from "../sales-styles";
import { InfoCard, type InfoItem } from "./info-card";

const text = salesFr.file;

const itemsOf = (company: ProspectCompanyResponse, phone: string | null): readonly InfoItem[] => [
  {
    key: "phone",
    label: text.fields.phone,
    icon: Phone,
    value: phone,
    missing: text.missing.phone,
  },
  ...(company.email === null
    ? []
    : [{ key: "email", label: text.fields.email, icon: Mail, value: company.email, missing: "" }]),
  {
    key: "activity",
    label: text.fields.activity,
    icon: House,
    value: company.activity,
    missing: text.missing.activity,
  },
  {
    key: "headcount",
    label: text.fields.headcount,
    icon: User,
    value: company.headcount,
    missing: text.missing.headcount,
    isMobileHidden: true,
  },
  {
    key: "currentTool",
    label: text.fields.currentTool,
    icon: File,
    value: company.currentTool,
    missing: text.missing.currentTool,
  },
  {
    key: "website",
    label: text.fields.website,
    icon: Globe,
    value: company.website,
    missing: text.missing.website,
  },
  {
    key: "siren",
    label: text.fields.siren,
    icon: AlignLeft,
    value: company.siren,
    missing: text.missing.siren,
    isMobileHidden: true,
  },
];

export const CompanyInformation = ({
  company,
  phone,
}: {
  readonly company: ProspectCompanyResponse;
  readonly phone: string | null;
}) => <InfoCard title={text.information} items={itemsOf(company, phone)} />;

export const CompanyAddress = ({ company }: { readonly company: ProspectCompanyResponse }) => {
  const town = [company.postalCode, company.city].filter((part) => part !== null).join(" ");
  return (
    <section className={cn(ADMIN_CARD_CLASS, "flex gap-3 px-3.5 py-3")}>
      <MapPin
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-[#94A3B8]"
        strokeWidth={1.8}
      />
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-[#64748B]">{text.address}</span>
        {company.address === null && town === "" ? (
          <span className={cn("text-[15px] lg:text-[13px]", MUTED_CLASS)}>
            {text.missing.address}
          </span>
        ) : (
          <>
            {company.address === null ? null : (
              <span className="text-[15px] break-words lg:text-[13px]">{company.address}</span>
            )}
            <span className="text-[15px] text-[#475569] lg:text-[13px]">
              {town === "" ? company.department : `${town} (${company.department})`}
            </span>
          </>
        )}
      </div>
    </section>
  );
};
