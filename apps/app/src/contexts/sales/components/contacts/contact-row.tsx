import type { ProspectContactSummaryResponse } from "@passalio/shared";
import { ChevronRight } from "lucide-react";
import { InitialsAvatar, type AvatarTone } from "@/components/initials-avatar";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { ContactLink } from "../record-links";
import { LIST_ROW_CLASS, MUTED_CLASS } from "../sales-styles";

const text = salesFr.contacts;

export const CONTACT_GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_140px_minmax(0,1fr)_24px] lg:gap-4";

const TONES: readonly AvatarTone[] = ["mint", "slate", "amber"];

type ContactRowProps = {
  readonly contact: ProspectContactSummaryResponse;
  readonly index: number;
};

export const ContactRow = ({ contact, index }: ContactRowProps) => {
  const place = `${contact.company.city ?? ""} (${contact.company.department})`.trim();
  return (
    <li className="border-b border-[#EEF2F6] last:border-b-0">
      <ContactLink
        id={contact.id}
        ariaLabel={text.open(contact.name)}
        className={cn(CONTACT_GRID_CLASS, LIST_ROW_CLASS)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <InitialsAvatar
            name={contact.name}
            tone={TONES[index % TONES.length] ?? "slate"}
            size="medium"
          />
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate text-[15px] font-semibold lg:text-[13px]">
              {contact.name}
            </span>
            <span className="truncate text-[13px] text-[#64748B]">
              <span className="lg:hidden">{contact.company.name}</span>
              <span className="hidden lg:inline">
                {contact.jobTitle ?? (contact.isLeader ? text.leader : "")}
              </span>
            </span>
          </span>
        </span>
        <span className="hidden min-w-0 flex-col gap-px lg:flex">
          <span className="truncate text-[13px]">{contact.company.name}</span>
          <span className="truncate text-[13px] text-[#64748B]">{place}</span>
        </span>
        <span
          className={cn(
            "text-[13px] whitespace-nowrap tabular-nums",
            contact.phone === null ? MUTED_CLASS : "text-[#475569]",
          )}
        >
          {contact.phone ?? salesFr.list.noPhone}
        </span>
        <span
          className={cn(
            "hidden truncate text-[13px] lg:block",
            contact.email === null && MUTED_CLASS,
          )}
        >
          {contact.email ?? salesFr.list.noEmail}
        </span>
        <ChevronRight aria-hidden="true" className="hidden size-4 text-[#94A3B8] lg:block" />
      </ContactLink>
    </li>
  );
};
