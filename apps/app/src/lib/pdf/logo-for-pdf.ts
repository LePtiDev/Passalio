const MAX_LOGO_SIDE = 600;

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

export type PdfLogo = { readonly format: "png"; readonly base64: string };

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
  return {
    format: "png",
    base64: canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""),
  };
};
