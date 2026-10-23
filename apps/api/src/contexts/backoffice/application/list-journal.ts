import {
  assertPlatformCan,
  type JournalEntryResponse,
  type JournalPageResponse,
  type PlatformActor,
} from "@passalio/shared";
import type { BackofficeDependencies, JournalRow, JournalScope } from "../domain/backoffice-ports";
import { PLATFORM_JOURNAL_ACTIONS } from "../domain/journal-actions";
import { decodeJournalCursor, encodeJournalCursor } from "./backoffice-cursors";

export const JOURNAL_PAGE_SIZE = 50;

export const toJournalEntry = (row: JournalRow): JournalEntryResponse => ({
  id: row.id,
  action: row.action,
  createdAt: row.createdAt.toISOString(),
  organization:
    row.organizationId === null || row.organizationName === null
      ? null
      : { id: row.organizationId, name: row.organizationName },
  actorName: row.actorName,
  impersonatorName: row.impersonatorName,
  data: row.data,
});

const journalPage =
  ({ readModel }: BackofficeDependencies) =>
  async (scope: JournalScope, cursor: string | undefined): Promise<JournalPageResponse> => {
    const rows = await readModel.journal(scope, decodeJournalCursor(cursor), JOURNAL_PAGE_SIZE + 1);
    const visible = rows.slice(0, JOURNAL_PAGE_SIZE);
    const last = visible.at(-1);
    return {
      entries: visible.map(toJournalEntry),
      nextCursor:
        rows.length > JOURNAL_PAGE_SIZE && last !== undefined ? encodeJournalCursor(last) : null,
    };
  };

export const listPlatformJournal =
  (dependencies: BackofficeDependencies) =>
  async (actor: PlatformActor, cursor: string | undefined): Promise<JournalPageResponse> => {
    assertPlatformCan(actor, "platform:read");
    return journalPage(dependencies)({ actions: PLATFORM_JOURNAL_ACTIONS }, cursor);
  };

export const listAccountJournal =
  (dependencies: BackofficeDependencies) =>
  async (
    actor: PlatformActor,
    input: { readonly organizationId: string; readonly cursor?: string | undefined },
  ): Promise<JournalPageResponse> => {
    assertPlatformCan(actor, "platform:read");
    return journalPage(dependencies)({ organizationId: input.organizationId }, input.cursor);
  };
