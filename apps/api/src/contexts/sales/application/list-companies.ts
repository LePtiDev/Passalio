import {
  assertPlatformCan,
  type PlatformActor,
  type ProspectCompaniesPageResponse,
  type ProspectStage,
} from "@passalio/shared";
import type { SalesDependencies } from "../domain/prospect-ports";
import { stageCountsOf } from "../domain/prospect-rules";
import { decodeNameCursor, pageOf } from "./prospect-cursors";
import { companySummaryResponse } from "./prospect-serializers";

export const COMPANIES_PAGE_SIZE = 50;

export type ListCompaniesInput = {
  readonly stage?: ProspectStage | undefined;
  readonly department?: string | undefined;
  readonly ownerUserId?: string | undefined;
  readonly query?: string | undefined;
  readonly cursor?: string | undefined;
  readonly limit?: number | undefined;
};

export const listCompanies =
  ({ companies }: Pick<SalesDependencies, "companies">) =>
  async (
    actor: PlatformActor,
    input: ListCompaniesInput,
  ): Promise<ProspectCompaniesPageResponse> => {
    assertPlatformCan(actor, "prospects:read");
    const scope = { department: input.department, ownerUserId: input.ownerUserId };
    const query = input.query?.trim();
    const limit = input.limit ?? COMPANIES_PAGE_SIZE;
    const [rows, counts] = await Promise.all([
      companies.list({
        ...scope,
        stage: input.stage,
        query: query === "" ? undefined : query,
        after: decodeNameCursor(input.cursor),
        limit: limit + 1,
      }),
      companies.countByStage(scope),
    ]);
    const { visible, nextCursor } = pageOf(rows, limit);
    return {
      companies: visible.map(companySummaryResponse),
      counts: stageCountsOf(counts),
      nextCursor,
    };
  };
