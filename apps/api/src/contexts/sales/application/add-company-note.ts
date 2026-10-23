import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectNote,
  type Result,
} from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";

export const addCompanyNote =
  ({
    companies,
    contacts,
    events,
    now,
    newId,
  }: Pick<SalesDependencies, "companies" | "contacts" | "events" | "now" | "newId">) =>
  async (
    actor: PlatformActor,
    companyId: string,
    note: ProspectNote,
  ): Promise<Result<{ readonly id: string }, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    if ((await companies.findById(companyId)) === undefined) {
      return err("company_not_found");
    }
    const contactId = note.contactId ?? null;
    if (contactId !== null && (await contacts.findById(contactId))?.companyId !== companyId) {
      return err("contact_not_in_company");
    }
    const id = newId();
    await events.add({
      id,
      companyId,
      contactId,
      authorUserId: actor.userId,
      kind: "note",
      body: note.body,
      fromStage: null,
      toStage: null,
      createdAt: now(),
    });
    return ok({ id });
  };
