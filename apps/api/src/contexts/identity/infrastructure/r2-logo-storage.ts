import type { LogoStorage } from "../domain/identity-ports";

export const createR2LogoStorage = (bucket: R2Bucket): LogoStorage => ({
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
