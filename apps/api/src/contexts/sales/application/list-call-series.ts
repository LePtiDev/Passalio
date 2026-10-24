import {
  assertPlatformCan,
  type CallSeriesTarget,
  type PlatformActor,
  type ProspectCallSeriesResponse,
} from "@passalio/shared";
import type { SalesDependencies } from "../domain/prospect-ports";
import { decodeNameCursor, pageOf } from "./prospect-cursors";

export const CALL_SERIES_SIZE = 30;

export type ListCallSeriesInput = {
  readonly target: CallSeriesTarget;
  readonly department?: string | undefined;
  readonly cursor?: string | undefined;
  readonly limit?: number | undefined;
};

export const listCallSeries =
  ({ calls }: Pick<SalesDependencies, "calls">) =>
  async (actor: PlatformActor, input: ListCallSeriesInput): Promise<ProspectCallSeriesResponse> => {
    assertPlatformCan(actor, "prospects:read");
    const limit = input.limit ?? CALL_SERIES_SIZE;
    const rows = await calls.series({
      department: input.department,
      target: input.target,
      after: decodeNameCursor(input.cursor),
      limit: limit + 1,
    });
    const { visible, nextCursor } = pageOf(rows, limit);
    return {
      companies: visible.map(({ searchName: _searchName, lastCallAt, ...row }) => ({
        ...row,
        lastCallAt: lastCallAt?.toISOString() ?? null,
      })),
      nextCursor,
    };
  };
