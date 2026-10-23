import {
  assertPlatformCan,
  err,
  ok,
  type PlatformActor,
  type ProspectContactChanges,
  type Result,
} from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";
import { contactSearchName, withChanges } from "../domain/prospect-rules";

export const updateContact =
  ({ contacts, now }: Pick<SalesDependencies, "contacts" | "now">) =>
  async (
    actor: PlatformActor,
    contactId: string,
    changes: ProspectContactChanges,
  ): Promise<Result<null, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    const contact = await contacts.findById(contactId);
    if (contact === undefined) {
      return err("contact_not_found");
    }
    const merged = withChanges(contact, changes);
    await contacts.update(contactId, {
      ...changes,
      searchName: contactSearchName({
        firstName: merged.firstName,
        lastName: merged.lastName,
      }),
      updatedAt: now(),
    });
    return ok(null);
  };
