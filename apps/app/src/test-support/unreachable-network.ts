import { vi } from "vitest";

export const makeNetworkUnreachable = () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => {
    throw new TypeError("Failed to fetch");
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
};
