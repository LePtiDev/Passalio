import { assertPlatformCan, type OverviewResponse, type PlatformActor } from "@passalio/shared";
import { activityWindow, trialEndOf } from "../domain/activity-window";
import type { AccountRow, BackofficeDependencies } from "../domain/backoffice-ports";
import { PLATFORM_JOURNAL_ACTIONS } from "../domain/journal-actions";
import { usageTrend } from "../domain/usage-trend";
import { summarizeAccounts } from "./account-summaries";
import { toJournalEntry } from "./list-journal";

export const OVERVIEW_LIST_SIZE = 5;
export const ENDING_SOON_DAYS = 7;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SCAN_LIMIT = 500;

const changeOf = ({ recent, previous }: AccountRow) =>
  usageTrend(recent, previous).changePercent ?? 0;

export const getOverview =
  ({ readModel, now }: BackofficeDependencies) =>
  async (actor: PlatformActor): Promise<OverviewResponse> => {
    assertPlatformCan(actor, "platform:read");
    const at = now();
    const window = activityWindow(at);
    const page = { query: undefined, after: undefined, limit: SCAN_LIMIT } as const;
    const [counts, activePeople, droppingRows, trialRows, movements] = await Promise.all([
      readModel.countAccounts(window),
      readModel.countActivePeople(window),
      readModel.listAccounts(window, { ...page, filter: "dropping" }),
      readModel.listAccounts(window, { ...page, filter: "trial" }),
      readModel.journal({ actions: PLATFORM_JOURNAL_ACTIONS }, undefined, OVERVIEW_LIST_SIZE),
    ]);
    const endingSoonBefore = new Date(at.getTime() + ENDING_SOON_DAYS * DAY_IN_MS);
    const endingRows = trialRows
      .filter(({ createdAt }) => trialEndOf(createdAt) <= endingSoonBefore)
      .toSorted((first, second) => first.createdAt.getTime() - second.createdAt.getTime());
    const worstDrops = droppingRows
      .toSorted((first, second) => changeOf(first) - changeOf(second))
      .slice(0, OVERVIEW_LIST_SIZE);
    const [dropping, endingTrials] = await Promise.all([
      summarizeAccounts(readModel, window, worstDrops),
      summarizeAccounts(readModel, window, endingRows.slice(0, OVERVIEW_LIST_SIZE)),
    ]);
    return {
      counts: { ...counts, endingSoon: endingRows.length, activePeople },
      dropping,
      endingTrials,
      movements: movements.map(toJournalEntry),
    };
  };
