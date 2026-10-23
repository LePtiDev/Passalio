import { JournalTimeline } from "../journal/journal-timeline";

export const AccountJournalPanel = ({ accountId }: { readonly accountId: string }) => (
  <JournalTimeline accountId={accountId} />
);
