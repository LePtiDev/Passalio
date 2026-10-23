import { randomInt } from "node:crypto";
import type { BrowserContext } from "@playwright/test";

const CLIENT_IP_HEADER = "cf-connecting-ip";

const octet = () => randomInt(1, 255);

export const uniqueClientIp = () => `10.${octet()}.${octet()}.${octet()}`;

export const assignClientIp = async (context: BrowserContext, ip = uniqueClientIp()) => {
  await context.route("**/api/**", (route) =>
    route.continue({ headers: { ...route.request().headers(), [CLIENT_IP_HEADER]: ip } }),
  );
  return ip;
};
