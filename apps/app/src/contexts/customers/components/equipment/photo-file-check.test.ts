import { EQUIPMENT_PHOTO_MAX_BYTES } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { photoFileProblemOf } from "./photo-file-check";

describe("photoFileProblemOf", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts a %s photo", (type) => {
    expect(photoFileProblemOf({ type, size: 1024 })).toBeNull();
  });

  it.each(["application/pdf", "image/gif", "image/heic", ""])("refuses a %s file", (type) => {
    expect(photoFileProblemOf({ type, size: 1024 })).toBe("wrong_type");
  });

  it("accepts a photo of exactly the maximum size", () => {
    expect(photoFileProblemOf({ type: "image/jpeg", size: EQUIPMENT_PHOTO_MAX_BYTES })).toBeNull();
  });

  it("refuses a photo one byte over the maximum size", () => {
    expect(photoFileProblemOf({ type: "image/jpeg", size: EQUIPMENT_PHOTO_MAX_BYTES + 1 })).toBe(
      "too_large",
    );
  });
});
