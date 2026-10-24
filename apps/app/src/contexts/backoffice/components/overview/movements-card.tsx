import type { JournalEntryResponse } from "@passalio/shared";
import { Link } from "@tanstack/react-router";
import { shortDay } from "../../calendar-labels";
import { backofficeFr } from "../../fr";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HEADER_CLASS,
  ADMIN_CARD_TITLE_CLASS,
  ADMIN_CARD_LINK_CLASS,
} from "../admin-styles";
import { JournalSentence } from "../journal/journal-sentence";

const text = backofficeFr.overview;

export const MovementsCard = ({
  entries,
}: {
  readonly entries: readonly JournalEntryResponse[];
}) => (
  <section className={`${ADMIN_CARD_CLASS} hidden lg:block`} aria-labelledby="movements-title">
    <div className={ADMIN_CARD_HEADER_CLASS}>
      <h2 id="movements-title" className={ADMIN_CARD_TITLE_CLASS}>
        {text.movementsTitle}
      </h2>
      <Link to="/admin/journal" className={ADMIN_CARD_LINK_CLASS}>
        {text.journalLink}
      </Link>
    </div>
    {entries.length === 0 ? (
      <p className="px-4 py-6 text-[13px] text-[#64748B]">{text.movementsEmpty}</p>
    ) : (
      <ul>
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-baseline gap-2.5 border-b border-[#EEF2F6] px-4 py-2.5 text-[13px] last:border-b-0"
          >
            <span
              aria-hidden="true"
              className="size-2 shrink-0 translate-y-[-1px] rounded-full bg-[#0E7C5A]"
            />
            <span className="min-w-0 flex-1">
              <JournalSentence entry={entry} isOrganizationShown />
            </span>
            <span className="shrink-0 text-xs text-[#64748B]">{shortDay(entry.createdAt)}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
);
