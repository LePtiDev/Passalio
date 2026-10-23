import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectContactFields,
  type ProspectContactResponse,
  type Result,
} from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";
import { contactSearchName } from "../domain/prospect-rules";
import { contactResponse } from "./prospect-serializers";

export const addContact =
  ({
    companies,
    contacts,
    now,
    newId,
  }: Pick<SalesDependencies, "companies" | "contacts" | "now" | "newId">) =>
  async (
    actor: PlatformActor,
    companyId: string,
    fields: ProspectContactFields,
  ): Promise<Result<ProspectContactResponse, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    if ((await companies.findById(companyId)) === undefined) {
      return err("company_not_found");
    }
    const at = now();
    const firstName = fields.firstName ?? null;
    const contact = {
      id: newId(),
      companyId,
      firstName,
      lastName: fields.lastName,
      searchName: contactSearchName({ firstName, lastName: fields.lastName }),
      jobTitle: fields.jobTitle ?? null,
      isLeader: fields.isLeader ?? false,
      isMain: fields.isMain ?? false,
      phone: fields.phone ?? null,
      mobile: fields.mobile ?? null,
      email: fields.email ?? null,
      bestTime: fields.bestTime ?? null,
      createdAt: at,
      updatedAt: at,
    };
    await contacts.create(contact);
    return ok(contactResponse(contact));
  };
