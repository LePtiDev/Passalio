import type { JournalEntryResponse } from "@passalio/shared";
import { backofficeFr } from "../../fr";
import { JOURNAL_ACTIONS, unknownAction } from "../../journal-fr";
import { AccountLink } from "../account-link";

const text = backofficeFr.journal;

const actorOf = (entry: JournalEntryResponse) => {
  if (entry.actorName !== null) {
    return entry.actorName;
  }
  return entry.action.startsWith("platform.") ? text.command : text.passalio;
};

type JournalSentenceProps = {
  readonly entry: JournalEntryResponse;
  readonly isOrganizationShown: boolean;
};

export const JournalSentence = ({ entry, isOrganizationShown }: JournalSentenceProps) => {
  const describe = JOURNAL_ACTIONS[entry.action];
  const verb =
    describe === undefined
      ? unknownAction(entry.action)
      : describe(entry.data ?? {}, entry.targetName ?? "");
  return (
    <span>
      <strong className="font-semibold">{actorOf(entry)}</strong> {verb}
      {isOrganizationShown && entry.organization !== null ? (
        <>
          {" "}
          <AccountLink
            accountId={entry.organization.id}
            className="inline-flex min-h-12 items-center font-semibold text-[#0E7C5A] hover:text-[#0F2A44] lg:inline lg:min-h-0"
          >
            {entry.organization.name}
          </AccountLink>
        </>
      ) : null}
      {entry.impersonatorName === null ? null : text.onBehalf(entry.impersonatorName)}
    </span>
  );
};
