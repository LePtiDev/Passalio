import type { PdfStorage } from "../domain/pdf-archive-ports";

export const createR2PdfStorage = (bucket: R2Bucket): PdfStorage => ({
  put: async (key, bytes, sha256) => {
    await bucket.put(key, bytes, {
      sha256,
      httpMetadata: { contentType: "application/pdf" },
    });
  },
});
