import {
  assertCan,
  err,
  newId,
  ok,
  type Actor,
  type Result,
  type EquipmentFields,
  calendarDateOf,
} from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { Equipment } from "../domain/customer-models";
import type { CustomerDependencies } from "../domain/customer-ports";
import { newEquipment } from "../domain/equipment-records";
import { checkReplaceable } from "../domain/equipment-rules";

export type AddEquipmentInput = {
  readonly id?: string | undefined;
  readonly siteId: string;
  readonly equipment: EquipmentFields;
  readonly replacesEquipmentId?: string | undefined;
};

type Dependencies = Pick<
  CustomerDependencies,
  "sites" | "equipments" | "organizationTrades" | "now"
>;

const replacementOf = async (
  { equipments }: Pick<Dependencies, "equipments">,
  organizationId: string,
  input: AddEquipmentInput,
): Promise<Result<Equipment | undefined, CustomerError>> => {
  if (input.replacesEquipmentId === undefined) {
    return ok(undefined);
  }
  const replaced = checkReplaceable(
    await equipments.findById(organizationId, input.replacesEquipmentId),
  );
  if (!replaced.isOk) {
    return replaced;
  }
  return replaced.value.siteId === input.siteId ? replaced : err("equipment_not_found");
};

export const addEquipment =
  (dependencies: Dependencies) =>
  async (actor: Actor, input: AddEquipmentInput): Promise<Result<Equipment, CustomerError>> => {
    assertCan(actor, "customers:write");
    const { sites, equipments, organizationTrades, now } = dependencies;
    if ((await sites.findById(actor.organizationId, input.siteId)) === undefined) {
      return err("site_not_found");
    }
    const id = input.id ?? newId();
    if (await equipments.exists(id)) {
      return err("already_exists");
    }
    const replaced = await replacementOf(dependencies, actor.organizationId, input);
    if (!replaced.isOk) {
      return replaced;
    }
    const at = now();
    const equipment = newEquipment(input.equipment, {
      id,
      organizationId: actor.organizationId,
      siteId: input.siteId,
      organizationTrades: await organizationTrades.of(actor.organizationId),
      at,
    });
    if (!equipment.isOk) {
      return equipment;
    }
    await equipments.create(
      equipment.value,
      replaced.value === undefined
        ? undefined
        : {
            replaced: replaced.value,
            removedOn: equipment.value.commissionedOn ?? calendarDateOf(at),
          },
    );
    return ok(equipment.value);
  };
