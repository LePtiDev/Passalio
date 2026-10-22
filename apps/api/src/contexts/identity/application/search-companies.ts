import { ok, type Result } from "@passalio/shared";
import type { CompanySummary } from "../domain/company-summary";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";

export const COMPANY_SEARCH_MIN_LENGTH = 3;

export const searchCompanies =
  ({ companyDirectory }: Pick<IdentityDependencies, "companyDirectory">) =>
  async (query: string): Promise<Result<readonly CompanySummary[], IdentityError>> => {
    const trimmed = query.trim();
    return trimmed.length < COMPANY_SEARCH_MIN_LENGTH ? ok([]) : companyDirectory.search(trimmed);
  };
