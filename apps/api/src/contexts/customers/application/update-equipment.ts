import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { CustomerDependencies } from "../domain/customer-ports";
import type { EquipmentChanges } from "../domain/customer-schemas";
import { equipmentUpdates } from "../domain/equipment-records";

export type UpdateEquipmentInput = {
  readonly equipmentId: string;
  readonly changes: EquipmentChanges;
};

export const updateEquipment =
  ({
    equipments,
    organizationTrades,
    now,
  }: Pick<CustomerDependencies, "equipments" | "organizationTrades" | "now">) =>
  async (actor: Actor, input: UpdateEquipmentInput): Promise<Result<void, CustomerError>> => {
    assertCan(actor, "customers:write");
    const current = await equipments.findById(actor.organizationId, input.equipmentId);
    if (current === undefined) {
      return err("equipment_not_found");
    }
    const updates = equipmentUpdates(current, input.changes, {
      at: now(),
      organizationTrades: await organizationTrades.of(actor.organizationId),
    });
    if (!updates.isOk) {
      return updates;
    }
    await equipments.update(actor.organizationId, input.equipmentId, updates.value);
    return ok(undefined);
  };
