import { EQUIPMENT_PHOTO_MAX_BYTES, ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { photoKey, uploadEquipmentPhoto } from "./upload-equipment-photo";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
const run = () => uploadEquipmentPhoto(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");
const photo = (overrides: { readonly contentType?: string; readonly bytes?: number } = {}) => ({
  equipmentId: "equipment-a",
  kind: "plate" as const,
  body: new ArrayBuffer(overrides.bytes ?? 1024),
  contentType: overrides.contentType ?? "image/jpeg",
});

beforeEach(() => {
  state = createInMemoryCustomerState();
  seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-b", "b");
});

describe("uploadEquipmentPhoto", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s add a photo", async (role) => {
    expect((await run()(organizationActorWith(role), photo())).isOk).toBe(true);
  });

  it("stores the file under the organization and answers the photo without its storage key", async () => {
    const result = await run()(technician, { ...photo(), id: "photo-new" });
    expect(result).toEqual({
      isOk: true,
      value: {
        id: "photo-new",
        organizationId: "organization-a",
        equipmentId: "equipment-a",
        kind: "plate",
        contentType: "image/jpeg",
        takenAt: NOW,
        createdByUserId: "user-technician",
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    expect(state.storedPhotos.get("organizations/organization-a/equipment-photos/photo-new")).toBe(
      "image/jpeg",
    );
    expect(photoKey("organization-a", "photo-new")).toBe(
      "organizations/organization-a/equipment-photos/photo-new",
    );
  });

  it("keeps the time the photo was taken offline", async () => {
    const takenAt = new Date("2026-10-20T08:00:00Z");
    const result = await run()(technician, { ...photo(), takenAt });
    expect(result.isOk && result.value.takenAt).toEqual(takenAt);
  });

  it.each(["image/jpeg", "image/png", "image/webp"])("accepts a %s image", async (contentType) => {
    expect((await run()(technician, photo({ contentType }))).isOk).toBe(true);
  });

  it.each(["application/pdf", "image/svg+xml", "image/gif"])(
    "refuses a %s file",
    async (contentType) => {
      expect(await run()(technician, photo({ contentType }))).toEqual({
        isOk: false,
        error: "invalid_photo",
      });
    },
  );

  it("accepts a photo of exactly 5 MB", async () => {
    expect(EQUIPMENT_PHOTO_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect((await run()(technician, photo({ bytes: EQUIPMENT_PHOTO_MAX_BYTES }))).isOk).toBe(true);
  });

  it("refuses a photo over 5 MB or an empty file, and stores nothing", async () => {
    expect(await run()(technician, photo({ bytes: EQUIPMENT_PHOTO_MAX_BYTES + 1 }))).toEqual({
      isOk: false,
      error: "invalid_photo",
    });
    expect(await run()(technician, photo({ bytes: 0 }))).toEqual({
      isOk: false,
      error: "invalid_photo",
    });
    expect(state.photos).toHaveLength(2);
    expect(state.storedPhotos.size).toBe(2);
  });

  it("refuses an equipment of another organization", async () => {
    expect(await run()(technician, { ...photo(), equipmentId: "equipment-b" })).toEqual({
      isOk: false,
      error: "equipment_not_found",
    });
    expect(state.storedPhotos.size).toBe(2);
  });

  it("refuses to reuse an id already taken", async () => {
    expect(await run()(technician, { ...photo(), id: "photo-b" })).toEqual({
      isOk: false,
      error: "already_exists",
    });
  });

  it("refuses a write during an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), photo()),
    ).rejects.toThrow(ForbiddenError);
    expect(state.storedPhotos.size).toBe(2);
  });
});

describe("uploadEquipmentPhoto on a missing equipment", () => {
  it("refuses an unknown equipment and stores no file", async () => {
    expect(await run()(technician, { ...photo(), equipmentId: "equipment-unknown" })).toEqual({
      isOk: false,
      error: "equipment_not_found",
    });
    expect(state.photos.map(({ id }) => id)).toEqual(["photo-a", "photo-b"]);
    expect(state.storedPhotos.size).toBe(2);
  });

  it("refuses an equipment of an archived customer and stores no file", async () => {
    await createInMemoryCustomerDependencies(state).customers.archive(
      "organization-a",
      "customer-a",
      NOW,
    );
    expect(await run()(technician, photo())).toEqual({
      isOk: false,
      error: "equipment_not_found",
    });
    expect(state.storedPhotos.size).toBe(2);
  });

  it("refuses a photo id already taken by another organization and keeps the other photo", async () => {
    expect(await run()(technician, { ...photo(), id: "photo-b" })).toEqual({
      isOk: false,
      error: "already_exists",
    });
    expect(state.photos.find(({ id }) => id === "photo-b")?.organizationId).toBe("organization-b");
    expect(state.storedPhotos.size).toBe(2);
  });
});
