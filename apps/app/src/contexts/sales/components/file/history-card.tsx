import { PROSPECT_NOTE_MAX_LENGTH, type ProspectEventResponse } from "@passalio/shared";
import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_CARD_CLASS } from "@/contexts/backoffice";
import { shortDayLabel } from "../../date-labels";
import { salesFr } from "../../fr";
import { useAddNote } from "../../hooks/use-sales-mutations";
import { FIELD_CLASS } from "../sales-styles";

const text = salesFr.history;

const eventText = (event: ProspectEventResponse) =>
  event.kind === "stage_changed" && event.toStage !== null
    ? [text.stageChanged(salesFr.stages[event.toStage]), event.body].filter(Boolean).join(" ")
    : (event.body ?? "");

type EventItemProps = {
  readonly event: ProspectEventResponse;
  readonly isContactShown: boolean;
  readonly now: Date;
};

const EventItem = ({ event, isContactShown, now }: EventItemProps) => {
  const author = event.authorName ?? text.passalio;
  const about = isContactShown && event.contact !== null ? text.about(event.contact.name) : null;
  return (
    <li className="flex gap-3 border-b border-[#EEF2F6] px-3.5 py-3 last:border-b-0">
      <InitialsAvatar
        name={author}
        tone={event.authorName === null ? "slate" : "mint"}
        size="small"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] lg:text-[13px]">
          <strong className="font-semibold">{author}</strong>{" "}
          <span className="text-[#64748B]">
            · {shortDayLabel(event.createdAt, now)}
            {about === null ? null : ` · ${about}`}
          </span>
        </span>
        <span className="text-[15px] leading-normal break-words whitespace-pre-line text-[#334155] lg:text-[13px]">
          {eventText(event)}
        </span>
      </span>
    </li>
  );
};

type NoteFormProps = {
  readonly companyId: string;
  readonly contactId: string | null;
};

const NoteForm = ({ companyId, contactId }: NoteFormProps) => {
  const [body, setBody] = useState("");
  const addNote = useAddNote();
  const { mutate } = addNote;
  const change = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setBody(event.target.value),
    [],
  );
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const note = body.trim();
      if (note === "") {
        return;
      }
      mutate({ companyId, note: { body: note, contactId } }, { onSuccess: () => setBody("") });
    },
    [body, companyId, contactId, mutate],
  );
  return (
    <form onSubmit={submit} className="flex gap-2 border-b border-[#EEF2F6] px-3.5 py-3">
      <Input
        value={body}
        onChange={change}
        maxLength={PROSPECT_NOTE_MAX_LENGTH}
        aria-label={text.noteLabel}
        placeholder={text.notePlaceholder}
        className={`${FIELD_CLASS} min-w-0 flex-1`}
      />
      <Button type="submit" disabled={addNote.isPending}>
        {text.add}
      </Button>
    </form>
  );
};

type HistoryCardProps = NoteFormProps & {
  readonly events: readonly ProspectEventResponse[];
  readonly isContactShown: boolean;
  readonly now: Date;
};

export const HistoryCard = ({
  companyId,
  contactId,
  events,
  isContactShown,
  now,
}: HistoryCardProps) => (
  <section className={ADMIN_CARD_CLASS}>
    <NoteForm companyId={companyId} contactId={contactId} />
    {events.length === 0 ? (
      <div className="flex flex-col gap-1 px-3.5 py-4">
        <span className="text-[15px] font-semibold lg:text-[13px]">{text.empty}</span>
        <span className="text-[13px] text-[#475569]">{text.emptyText}</span>
      </div>
    ) : (
      <ol>
        {events.map((event) => (
          <EventItem key={event.id} event={event} isContactShown={isContactShown} now={now} />
        ))}
      </ol>
    )}
  </section>
);
