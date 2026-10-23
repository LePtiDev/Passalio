import {
  err,
  ForbiddenError,
  ok,
  type Actor,
  type CustomerMutation,
  type Result,
} from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { CustomerDependencies } from "../domain/customer-ports";
import { addEquipment } from "./add-equipment";
import { addSite } from "./add-site";
import { archiveCustomer } from "./archive-customer";
import { createCustomer } from "./create-customer";
import { removeEquipment } from "./remove-equipment";
import { updateCustomer } from "./update-customer";
import { updateEquipment } from "./update-equipment";
import { updateSite } from "./update-site";

export type MutationError = CustomerError | "forbidden";

type Outcome = Result<unknown, CustomerError>;

const run = async (
  dependencies: CustomerDependencies,
  actor: Actor,
  mutation: CustomerMutation,
): Promise<Outcome> => {
  switch (mutation.type) {
    case "create_customer":
      return createCustomer(dependencies)(actor, {
        id: mutation.customerId,
        customer: mutation.customer,
      });
    case "update_customer":
      return updateCustomer(dependencies)(actor, mutation);
    case "archive_customer":
      return archiveCustomer(dependencies)(actor, mutation);
    case "add_site":
      return addSite(dependencies)(actor, {
        id: mutation.siteId,
        customerId: mutation.customerId,
        site: mutation.site,
      });
    case "update_site":
      return updateSite(dependencies)(actor, mutation);
    case "add_equipment":
      return addEquipment(dependencies)(actor, {
        id: mutation.equipmentId,
        siteId: mutation.siteId,
        replacesEquipmentId: mutation.replacesEquipmentId,
        equipment: mutation.equipment,
      });
    case "update_equipment":
      return updateEquipment(dependencies)(actor, mutation);
    default:
      return removeEquipment(dependencies)(actor, mutation);
  }
};

const isAlreadyApplied = async (
  { customers, sites, equipments }: CustomerDependencies,
  { organizationId }: Actor,
  mutation: CustomerMutation,
) => {
  switch (mutation.type) {
    case "create_customer":
      return (await customers.findById(organizationId, mutation.customerId)) !== undefined;
    case "add_site":
      return (await sites.findById(organizationId, mutation.siteId)) !== undefined;
    case "add_equipment":
      return (await equipments.findById(organizationId, mutation.equipmentId)) !== undefined;
    default:
      return false;
  }
};

export const applyCustomerMutation =
  (dependencies: CustomerDependencies) =>
  async (actor: Actor, mutation: CustomerMutation): Promise<Result<void, MutationError>> => {
    try {
      const outcome = await run(dependencies, actor, mutation);
      if (outcome.isOk) {
        return ok(undefined);
      }
      return outcome.error === "already_exists" &&
        (await isAlreadyApplied(dependencies, actor, mutation))
        ? ok(undefined)
        : err(outcome.error);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return err("forbidden");
      }
      throw error;
    }
  };
