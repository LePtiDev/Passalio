import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectCompanyFileResponse,
  type Result,
} from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";
import { companyResponse, contactResponse, eventResponse } from "./prospect-serializers";

export const HISTORY_LIMIT = 100;

export const getCompanyFile =
  ({ companies, contacts, events }: Pick<SalesDependencies, "companies" | "contacts" | "events">) =>
  async (
    actor: PlatformActor,
    companyId: string,
  ): Promise<Result<ProspectCompanyFileResponse, ProspectError>> => {
    assertPlatformCan(actor, "prospects:read");
    const [company, summary, companyContacts, history] = await Promise.all([
      companies.findById(companyId),
      companies.summaryOf(companyId),
      contacts.listByCompany(companyId),
      events.ofCompany(companyId, HISTORY_LIMIT),
    ]);
    if (company === undefined) {
      return err("company_not_found");
    }
    return ok({
      company: companyResponse(company, summary?.owner ?? null),
      contacts: companyContacts.map(contactResponse),
      events: history.map(eventResponse),
    });
  };
