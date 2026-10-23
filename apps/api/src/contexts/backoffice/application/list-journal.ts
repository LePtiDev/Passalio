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
  targetName: row.targetName,
  data: row.data,
});

export type JournalPageInput = {
  readonly cursor?: string | undefined;
  readonly limit?: number | undefined;
};

const journalPage =
  ({ readModel }: BackofficeDependencies) =>
  async (scope: JournalScope, page: JournalPageInput): Promise<JournalPageResponse> => {
    const limit = page.limit ?? JOURNAL_PAGE_SIZE;
    const rows = await readModel.journal(scope, decodeJournalCursor(page.cursor), limit + 1);
    const visible = rows.slice(0, limit);
    const last = visible.at(-1);
    return {
      entries: visible.map(toJournalEntry),
      nextCursor: rows.length > limit && last !== undefined ? encodeJournalCursor(last) : null,
    };
  };

export const listPlatformJournal =
  (dependencies: BackofficeDependencies) =>
  async (actor: PlatformActor, page: JournalPageInput): Promise<JournalPageResponse> => {
    assertPlatformCan(actor, "platform:read");
    return journalPage(dependencies)({ actions: PLATFORM_JOURNAL_ACTIONS }, page);
  };

export const listAccountJournal =
  (dependencies: BackofficeDependencies) =>
  async (
    actor: PlatformActor,
    input: JournalPageInput & { readonly organizationId: string },
  ): Promise<JournalPageResponse> => {
    assertPlatformCan(actor, "platform:read");
    return journalPage(dependencies)({ organizationId: input.organizationId }, input);
  };
