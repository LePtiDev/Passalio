import type { ViewportSize } from "@playwright/test";

export const MOBILE: Readonly<ViewportSize> = { width: 360, height: 760 };

export const DESKTOP: Readonly<ViewportSize> = { width: 1440, height: 900 };

export const VIEWPORTS = [
  { name: "mobile", size: MOBILE },
  { name: "desktop", size: DESKTOP },
] as const;
