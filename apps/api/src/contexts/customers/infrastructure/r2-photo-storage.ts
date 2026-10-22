import type { PhotoStorage } from "../domain/customer-ports";

export const createR2PhotoStorage = (bucket: R2Bucket): PhotoStorage => ({
  put: async (key, body, contentType) => {
    await bucket.put(key, body, { httpMetadata: { contentType } });
  },
  get: async (key) => {
    const object = await bucket.get(key);
    return object === null
      ? undefined
      : {
          body: object.body,
          contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
        };
  },
});
