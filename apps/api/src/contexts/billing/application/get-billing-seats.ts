import { assertCan, type Actor, type BillingSeatsResponse } from "@passalio/shared";
import type { BillingDependencies } from "../domain/billing-ports";

export const getBillingSeats =
  ({ contacts }: BillingDependencies) =>
  async (actor: Actor): Promise<BillingSeatsResponse> => {
    assertCan(actor, "organization:read");
    const [technicianCount, ownerName] = await Promise.all([
      contacts.countTechnicians(actor.organizationId),
      contacts.findOwnerName(actor.organizationId),
    ]);
    return { technicianCount, ownerName: ownerName ?? null };
  };
