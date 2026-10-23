import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectContactFileResponse,
  type Result,
} from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";
import { HISTORY_LIMIT } from "./get-company-file";
import { companySummaryResponse, contactResponse, eventResponse } from "./prospect-serializers";

export const getContactFile =
  ({ companies, contacts, events }: Pick<SalesDependencies, "companies" | "contacts" | "events">) =>
  async (
    actor: PlatformActor,
    contactId: string,
  ): Promise<Result<ProspectContactFileResponse, ProspectError>> => {
    assertPlatformCan(actor, "prospects:read");
    const contact = await contacts.findById(contactId);
    const company =
      contact === undefined ? undefined : await companies.summaryOf(contact.companyId);
    if (contact === undefined || company === undefined) {
      return err("contact_not_found");
    }
    return ok({
      contact: contactResponse(contact),
      company: companySummaryResponse(company),
      events: (await events.ofContact(contactId, HISTORY_LIMIT)).map(eventResponse),
    });
  };
