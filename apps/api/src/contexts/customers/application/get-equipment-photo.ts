import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { CustomerDependencies, StoredPhoto } from "../domain/customer-ports";

export const getEquipmentPhoto =
  ({ photos, photoStorage }: Pick<CustomerDependencies, "photos" | "photoStorage">) =>
  async (
    actor: Actor,
    { photoId }: { readonly photoId: string },
  ): Promise<Result<StoredPhoto, CustomerError>> => {
    assertCan(actor, "customers:read");
    const photo = await photos.findById(actor.organizationId, photoId);
    const stored = photo === undefined ? undefined : await photoStorage.get(photo.storageKey);
    return stored === undefined ? err("photo_not_found") : ok(stored);
  };
