import type {
  ProspectCompanyResponse,
  ProspectFollowUpResponse,
  ProspectTaskResponse,
} from "@passalio/shared";
import { Phone } from "lucide-react";
import { whenLabel } from "../../call-time-labels";
import { callsFr } from "../../fr-calls";
import { CompanyLink } from "../record-links";
import type { DeskContact } from "./call-desk-model";
import { TaskKindChip } from "./task-parts";

const text = callsFr.session;

const telHref = (phone: string) => `tel:${phone.replaceAll(/[^\d+]/g, "")}`;

type ContactCardProps = {
  readonly company: ProspectCompanyResponse;
  readonly desk: DeskContact;
  readonly followUp: ProspectFollowUpResponse;
  readonly task: ProspectTaskResponse | null;
  readonly now: Date;
};

const statusOf = (
  { lastCall }: ProspectFollowUpResponse,
  company: ProspectCompanyResponse,
  now: Date,
) =>
  [
    lastCall === null
      ? text.neverCalled
      : text.lastCall(whenLabel(new Date(lastCall.at), now), callsFr.outcomes[lastCall.outcome]),
    company.owner === null ? null : text.followedBy(company.owner.name),
  ]
    .filter(Boolean)
    .join(" ");

export const ContactCard = ({ company, desk, followUp, task, now }: ContactCardProps) => {
  const { contact, phone } = desk;
  const place = [company.name, company.city, contact?.jobTitle?.toLowerCase() ?? null]
    .filter(Boolean)
    .join(" · ");
  return (
    <section
      aria-labelledby="call-contact"
      className="flex flex-col gap-3 lg:rounded-xl lg:border lg:border-[#E3E8EF] lg:bg-white lg:p-[18px]"
    >
      <span className="flex flex-col gap-0.5">
        <CompanyLink
          id={company.id}
          className="flex min-h-12 items-center self-start hover:underline lg:min-h-0"
        >
          <h2 id="call-contact" className="text-xl font-bold lg:text-lg">
            {contact?.name ?? company.name}
          </h2>
        </CompanyLink>
        <span className="text-sm text-[#475569] lg:text-[13px]">{place}</span>
      </span>
      {task === null ? null : (
        <span className="flex items-center gap-2 self-start text-[13px] font-semibold">
          <TaskKindChip kind={task.kind} />
          {whenLabel(new Date(task.dueAt), now)}
        </span>
      )}
      {phone === null ? (
        <span className="flex h-12 items-center justify-center rounded-[10px] border border-dashed border-[#D5DDE6] text-[15px] font-semibold text-[#64748B] lg:h-11">
          {text.noPhone}
        </span>
      ) : (
        <a
          href={telHref(phone)}
          aria-label={text.callNumber(phone)}
          className="flex h-12 items-center justify-center gap-2.5 rounded-[10px] bg-[#0E7C5A] text-base font-bold text-white tabular-nums shadow-[0_1px_2px_rgba(15,42,68,0.2)] hover:bg-[#0B6B4E] lg:h-11"
        >
          <Phone aria-hidden="true" className="size-[18px]" strokeWidth={2} />
          {phone}
        </a>
      )}
      <p className="rounded-xl bg-[#F7F9FB] px-3.5 py-3 text-sm leading-normal text-[#475569] lg:bg-transparent lg:p-0 lg:text-[13px] lg:text-[#64748B]">
        {statusOf(followUp, company, now)}
      </p>
    </section>
  );
};
