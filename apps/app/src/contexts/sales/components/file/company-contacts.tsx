import type { ProspectContactResponse } from "@passalio/shared";
import { ChevronRight, Plus } from "lucide-react";
import { InitialsAvatar, type AvatarTone } from "@/components/initials-avatar";
import { ADMIN_CARD_CLASS } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { ContactLink } from "../record-links";
import { ACTION_LINK_CLASS, MUTED_CLASS, SECTION_TITLE_CLASS } from "../sales-styles";

const text = salesFr.file;

const TONES: readonly AvatarTone[] = ["mint", "slate", "amber"];

const roleOf = (contact: ProspectContactResponse) =>
  contact.jobTitle ?? (contact.isLeader ? salesFr.contacts.leader : null);

const ContactLine = ({
  contact,
  index,
}: {
  readonly contact: ProspectContactResponse;
  readonly index: number;
}) => {
  const phone = contact.phone ?? contact.mobile;
  return (
    <li className="border-t border-[#EEF2F6] first:border-t-0 lg:border-t-0 lg:border-b lg:last:border-b-0">
      <ContactLink
        id={contact.id}
        ariaLabel={salesFr.contacts.open(contact.name)}
        className="grid min-h-16 grid-cols-[minmax(0,1fr)_18px] items-center gap-3 px-3.5 py-2 hover:bg-[#F7F9FB] lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_140px_140px_24px] lg:gap-4 lg:py-2.5"
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
            <span className="truncate text-[13px] text-[#64748B]">{roleOf(contact) ?? ""}</span>
          </span>
        </span>
        <span
          className={cn(
            "hidden text-[13px] whitespace-nowrap tabular-nums lg:block",
            phone === null ? MUTED_CLASS : "text-[#475569]",
          )}
        >
          {phone ?? salesFr.list.noPhone}
        </span>
        <span
          className={cn(
            "hidden truncate text-[13px] lg:block",
            contact.email === null && MUTED_CLASS,
          )}
        >
          {contact.email ?? salesFr.list.noEmail}
        </span>
        <ChevronRight aria-hidden="true" className="size-[18px] text-[#94A3B8] lg:size-4" />
      </ContactLink>
    </li>
  );
};

type CompanyContactsProps = {
  readonly contacts: readonly ProspectContactResponse[];
  readonly onAdd: () => void;
};

const ContactsList = ({ contacts }: { readonly contacts: readonly ProspectContactResponse[] }) =>
  contacts.length === 0 ? (
    <div className="flex flex-col gap-1 border-t border-[#EEF2F6] px-3.5 py-4 lg:border-t-0">
      <span className="text-[15px] font-semibold lg:text-[13px]">{text.contactsEmpty}</span>
      <span className="text-[13px] text-[#475569]">{text.contactsEmptyText}</span>
    </div>
  ) : (
    <ul>
      {contacts.map((contact, index) => (
        <ContactLine key={contact.id} contact={contact} index={index} />
      ))}
    </ul>
  );

export const CompanyContacts = ({ contacts, onAdd }: CompanyContactsProps) => (
  <>
    <div className="hidden items-center justify-between lg:flex">
      <h2 className={SECTION_TITLE_CLASS}>{text.contacts}</h2>
      <button type="button" onClick={onAdd} className={ACTION_LINK_CLASS}>
        <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
        {text.addContact}
      </button>
    </div>
    <section className={ADMIN_CARD_CLASS}>
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-1 lg:hidden">
        <h2 className={SECTION_TITLE_CLASS}>{text.contacts}</h2>
        <button
          type="button"
          onClick={onAdd}
          className={cn(ACTION_LINK_CLASS, "-my-3.5 min-w-12 justify-end")}
        >
          {text.addContactShort}
        </button>
      </div>
      <ContactsList contacts={contacts} />
    </section>
  </>
);
