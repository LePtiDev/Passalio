import { assertCan, ok, type Actor, type Result, calendarDateOf } from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { CustomerDependencies } from "../domain/customer-ports";
import { checkReplaceable } from "../domain/equipment-rules";

export type RemoveEquipmentInput = {
  readonly equipmentId: string;
  readonly removedOn?: string | undefined;
};

export const removeEquipment =
  ({ equipments, now }: Pick<CustomerDependencies, "equipments" | "now">) =>
  async (actor: Actor, input: RemoveEquipmentInput): Promise<Result<void, CustomerError>> => {
    assertCan(actor, "customers:write");
    const equipment = checkReplaceable(
      await equipments.findById(actor.organizationId, input.equipmentId),
    );
    if (!equipment.isOk) {
      return equipment;
    }
    const at = now();
    await equipments.update(actor.organizationId, input.equipmentId, {
      status: "removed",
      removedOn: input.removedOn ?? calendarDateOf(at),
      updatedAt: at,
    });
    return ok(undefined);
  };
