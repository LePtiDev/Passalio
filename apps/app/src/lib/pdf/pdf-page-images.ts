import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

const RENDER_SCALE = 2;

const pageImage = async (
  document: Awaited<ReturnType<typeof getDocument>["promise"]>,
  pageNumber: number,
) => {
  const page = await document.getPage(pageNumber);
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("canvas_unavailable");
  }
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
};

export const pdfPageImages = async (bytes: Uint8Array): Promise<readonly string[]> => {
  GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  const document = await getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
  try {
    return await Promise.all(
      Array.from({ length: document.numPages }, (_, index) => pageImage(document, index + 1)),
    );
  } finally {
    await document.destroy();
  }
};
