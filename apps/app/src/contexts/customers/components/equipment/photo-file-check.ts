import { EQUIPMENT_PHOTO_CONTENT_TYPES, EQUIPMENT_PHOTO_MAX_BYTES } from "@passalio/shared";

export type PhotoFileProblem = "wrong_type" | "too_large";

export const photoFileProblemOf = (file: Pick<File, "type" | "size">): PhotoFileProblem | null => {
  if (!EQUIPMENT_PHOTO_CONTENT_TYPES.some((accepted) => accepted === file.type)) {
    return "wrong_type";
  }
  return file.size > EQUIPMENT_PHOTO_MAX_BYTES ? "too_large" : null;
};
