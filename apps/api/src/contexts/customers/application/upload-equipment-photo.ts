import {
  assertCan,
  EQUIPMENT_PHOTO_CONTENT_TYPES,
  EQUIPMENT_PHOTO_MAX_BYTES,
  err,
  newId,
  ok,
  type Actor,
  type EquipmentPhotoKind,
  type Result,
} from "@passalio/shared";
import type { CustomerError } from "../domain/customer-error";
import type { EquipmentPhoto } from "../domain/customer-models";
import type { CustomerDependencies } from "../domain/customer-ports";

export type UploadEquipmentPhotoInput = {
  readonly id?: string | undefined;
  readonly equipmentId: string;
  readonly kind: EquipmentPhotoKind;
  readonly takenAt?: Date | undefined;
  readonly body: ArrayBuffer;
  readonly contentType: string;
};

const isAcceptedContentType = (contentType: string) =>
  EQUIPMENT_PHOTO_CONTENT_TYPES.some((accepted) => accepted === contentType);

export const photoKey = (organizationId: string, photoId: string) =>
  `organizations/${organizationId}/equipment-photos/${photoId}`;

export const uploadEquipmentPhoto =
  ({
    equipments,
    photos,
    photoStorage,
    now,
  }: Pick<CustomerDependencies, "equipments" | "photos" | "photoStorage" | "now">) =>
  async (
    actor: Actor,
    input: UploadEquipmentPhotoInput,
  ): Promise<Result<Omit<EquipmentPhoto, "storageKey">, CustomerError>> => {
    assertCan(actor, "customers:write");
    if (
      !isAcceptedContentType(input.contentType) ||
      input.body.byteLength === 0 ||
      input.body.byteLength > EQUIPMENT_PHOTO_MAX_BYTES
    ) {
      return err("invalid_photo");
    }
    if ((await equipments.findById(actor.organizationId, input.equipmentId)) === undefined) {
      return err("equipment_not_found");
    }
    const id = input.id ?? newId();
    if (await photos.exists(id)) {
      return err("already_exists");
    }
    const at = now();
    const photo: EquipmentPhoto = {
      id,
      organizationId: actor.organizationId,
      equipmentId: input.equipmentId,
      kind: input.kind,
      storageKey: photoKey(actor.organizationId, id),
      contentType: input.contentType,
      takenAt: input.takenAt ?? at,
      createdByUserId: actor.userId,
      createdAt: at,
      updatedAt: at,
    };
    await photoStorage.put(photo.storageKey, input.body, input.contentType);
    await photos.create(photo);
    const { storageKey: _storageKey, ...visible } = photo;
    return ok(visible);
  };
