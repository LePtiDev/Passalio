import { assertPlatformCan, type AccountsPageResponse, type PlatformActor } from "@passalio/shared";
import { activityWindow } from "../domain/activity-window";
import type { AccountFilter, BackofficeDependencies } from "../domain/backoffice-ports";
import { summarizeAccounts } from "./account-summaries";
import { decodeAccountCursor, encodeAccountCursor } from "./backoffice-cursors";

export const ACCOUNTS_PAGE_SIZE = 25;

export type ListAccountsInput = {
  readonly filter: AccountFilter;
  readonly query?: string | undefined;
  readonly cursor?: string | undefined;
  readonly limit?: number | undefined;
};

export const listAccounts =
  ({ readModel, now }: BackofficeDependencies) =>
  async (actor: PlatformActor, input: ListAccountsInput): Promise<AccountsPageResponse> => {
    assertPlatformCan(actor, "platform:read");
    const window = activityWindow(now());
    const query = input.query?.trim();
    const limit = input.limit ?? ACCOUNTS_PAGE_SIZE;
    const [rows, counts] = await Promise.all([
      readModel.listAccounts(window, {
        filter: input.filter,
        query: query === "" ? undefined : query,
        after: decodeAccountCursor(input.cursor),
        limit: limit + 1,
      }),
      readModel.countAccounts(window),
    ]);
    const visible = rows.slice(0, limit);
    const last = visible.at(-1);
    return {
      accounts: await summarizeAccounts(readModel, window, visible),
      counts,
      nextCursor: rows.length > limit && last !== undefined ? encodeAccountCursor(last) : null,
    };
  };
