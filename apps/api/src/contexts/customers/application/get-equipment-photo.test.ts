import { ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { getEquipmentPhoto } from "./get-equipment-photo";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
let photoKey: string;
const run = () => getEquipmentPhoto(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");

beforeEach(() => {
  state = createInMemoryCustomerState();
  photoKey = seedCustomerOf(state, "organization-a", "a").photo.storageKey;
  seedCustomerOf(state, "organization-b", "b");
  state.storedPhotos.set(photoKey, "image/png");
});

describe("getEquipmentPhoto", () => {
  it.each(ORGANIZATION_ROLES)("serves a photo to a %s", async (role) => {
    const result = await run()(organizationActorWith(role), { photoId: "photo-a" });
    expect(result.isOk && result.value.contentType).toBe("image/png");
  });

  it("serves a photo during an impersonation", async () => {
    const result = await run()(organizationActorWith("owner", { isImpersonating: true }), {
      photoId: "photo-a",
    });
    expect(result.isOk).toBe(true);
  });

  it("does not serve a photo of another organization", async () => {
    expect(await run()(technician, { photoId: "photo-b" })).toEqual({
      isOk: false,
      error: "photo_not_found",
    });
  });

  it("answers not found for an unknown photo", async () => {
    expect(await run()(technician, { photoId: "photo-unknown" })).toEqual({
      isOk: false,
      error: "photo_not_found",
    });
  });

  it("answers not found when the file is missing from storage", async () => {
    state.storedPhotos.delete(photoKey);
    expect(await run()(technician, { photoId: "photo-a" })).toEqual({
      isOk: false,
      error: "photo_not_found",
    });
  });

  it("answers not found for a photo of an archived customer", async () => {
    state.archivedAt.set("photo-a", NOW);
    expect(await run()(technician, { photoId: "photo-a" })).toEqual({
      isOk: false,
      error: "photo_not_found",
    });
  });
});
