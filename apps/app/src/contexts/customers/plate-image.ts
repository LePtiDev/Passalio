import { EQUIPMENT_PHOTO_CONTENT_TYPES } from "@passalio/shared";

const PLATE_IMAGE_MAX_SIDE = 2048;
const PLATE_IMAGE_KEPT_BYTES = 1_500_000;
const PLATE_IMAGE_QUALITY = 0.85;

const isKeptAsIs = (file: Blob) =>
  file.size <= PLATE_IMAGE_KEPT_BYTES &&
  EQUIPMENT_PHOTO_CONTENT_TYPES.some((contentType) => contentType === file.type);

const canvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", PLATE_IMAGE_QUALITY);
  });

export const plateImageOf = async (file: Blob): Promise<Blob> => {
  if (isKeptAsIs(file) || typeof createImageBitmap !== "function") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PLATE_IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return (await canvasBlob(canvas)) ?? file;
  } catch {
    return file;
  }
};
