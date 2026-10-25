import { readFileSync } from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { CertificateFonts } from "./render-certificate";

const fontFile = (name: string) =>
  new Uint8Array(readFileSync(new URL(`../fonts/PlusJakartaSans-${name}.ttf`, import.meta.url)));

export const certificateFonts = (): CertificateFonts => ({
  regular: fontFile("Regular"),
  semibold: fontFile("SemiBold"),
  bold: fontFile("Bold"),
  extrabold: fontFile("ExtraBold"),
});

const openPdf = (bytes: Uint8Array) =>
  getDocument({ data: bytes.slice(), useSystemFonts: false, isEvalSupported: false }).promise;

export const pdfPageTexts = async (bytes: Uint8Array): Promise<readonly string[]> => {
  const document = await openPdf(bytes);
  const pages = await Promise.all(
    Array.from({ length: document.numPages }, async (_, index) => {
      const page = await document.getPage(index + 1);
      const content = await page.getTextContent();
      return content.items
        .map((item) => ("str" in item ? `${item.str}${item.hasEOL ? "\n" : ""}` : ""))
        .join("")
        .replaceAll(/[ \t]+/g, " ");
    }),
  );
  await document.destroy();
  return pages;
};

export const pdfText = async (bytes: Uint8Array) =>
  (await pdfPageTexts(bytes)).join("\n").replaceAll(/\s+/g, " ");

export const pdfMetadata = async (bytes: Uint8Array) => {
  const document = await openPdf(bytes);
  const metadata = await document.getMetadata();
  const pageCount = document.numPages;
  await document.destroy();
  return { info: metadata.info, pageCount };
};

const renderedOf = async (renderTask: unknown) => {
  if (typeof renderTask === "object" && renderTask !== null && "promise" in renderTask) {
    await renderTask.promise;
  }
};

export const pdfPagePngs = async (bytes: Uint8Array, scale = 1.5): Promise<readonly Buffer[]> => {
  const { createCanvas } = await import("@napi-rs/canvas");
  const document = await openPdf(bytes);
  const pngs = await Promise.all(
    Array.from({ length: document.numPages }, async (_, index) => {
      const page = await document.getPage(index + 1);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const renderTask: unknown = Reflect.apply(page.render.bind(page), page, [
        { canvasContext: canvas.getContext("2d"), viewport },
      ]);
      await renderedOf(renderTask);
      return canvas.toBuffer("image/png");
    }),
  );
  await document.destroy();
  return pngs;
};
