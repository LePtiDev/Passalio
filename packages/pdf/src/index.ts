import { PDFDocument } from "pdf-lib";

export const createEmptyPdf = async (): Promise<Uint8Array> => {
  const document = await PDFDocument.create();
  document.addPage();
  return document.save();
};
