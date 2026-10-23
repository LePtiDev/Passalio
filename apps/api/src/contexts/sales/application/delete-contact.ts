import { assertPlatformCan, err, ok, type PlatformActor, type Result } from "@passalio/shared";
import type { ProspectError } from "../domain/prospect-error";
import type { SalesDependencies } from "../domain/prospect-ports";

export const deleteContact =
  ({ contacts }: Pick<SalesDependencies, "contacts">) =>
  async (actor: PlatformActor, contactId: string): Promise<Result<null, ProspectError>> => {
    assertPlatformCan(actor, "prospects:write");
    if ((await contacts.findById(contactId)) === undefined) {
      return err("contact_not_found");
    }
    await contacts.delete(contactId);
    return ok(null);
  };
