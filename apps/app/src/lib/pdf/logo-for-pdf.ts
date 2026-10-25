import { LOGO_MAX_BASE64_LENGTH, type DocumentLogo } from "@passalio/trades";

const MAX_LOGO_SIDE = 600;

const JPEG_QUALITY = 0.85;

const blobAsImage = (blob: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.addEventListener("load", () => {
      URL.revokeObjectURL(url);
      resolve(image);
    });
    image.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("logo_unreadable"));
    });
    image.src = url;
  });

export type PdfLogo = DocumentLogo;

const base64Of = (dataUrl: string) => dataUrl.slice(dataUrl.indexOf(",") + 1);

export const fittingLogo = (pngBase64: string, jpegBase64: () => string): PdfLogo =>
  pngBase64.length <= LOGO_MAX_BASE64_LENGTH
    ? { format: "png", base64: pngBase64 }
    : { format: "jpeg", base64: jpegBase64() };

const jpegOnWhite = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  return base64Of(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
};

export const logoForPdf = async (blob: Blob): Promise<PdfLogo> => {
  const image = await blobAsImage(blob);
  const width = image.naturalWidth || MAX_LOGO_SIDE;
  const height = image.naturalHeight || MAX_LOGO_SIDE;
  const ratio = Math.min(1, MAX_LOGO_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("canvas_unavailable");
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return fittingLogo(base64Of(canvas.toDataURL("image/png")), () => jpegOnWhite(canvas, context));
};
