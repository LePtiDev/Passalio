import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { CustomerFile } from "../domain/customer-models";
import type { CustomerDependencies } from "../domain/customer-ports";

export const getCustomerFile =
  ({
    customers,
    sites,
    equipments,
    photos,
  }: Pick<CustomerDependencies, "customers" | "sites" | "equipments" | "photos">) =>
  async (
    actor: Actor,
    { customerId }: { readonly customerId: string },
  ): Promise<Result<CustomerFile, CustomerError>> => {
    assertCan(actor, "customers:read");
    const customer = await customers.findById(actor.organizationId, customerId);
    if (customer === undefined) {
      return err("customer_not_found");
    }
    const customerSites = await sites.listByCustomer(actor.organizationId, customerId);
    const siteEquipments = await equipments.listBySites(
      actor.organizationId,
      customerSites.map(({ id }) => id),
    );
    const equipmentPhotos = await photos.listByEquipments(
      actor.organizationId,
      siteEquipments.map(({ id }) => id),
    );
    return ok({
      customer,
      sites: customerSites,
      equipments: siteEquipments,
      photos: equipmentPhotos.map(({ storageKey: _storageKey, ...photo }) => photo),
    });
  };
