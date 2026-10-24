import { vi } from "vitest";

export const goOffline = () => vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

export const goOnline = () => {
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
  window.dispatchEvent(new Event("online"));
};
