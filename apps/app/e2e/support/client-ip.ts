import { randomInt } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import { APP_URL } from "../../playwright.config";

const CLIENT_IP_HEADER = "cf-connecting-ip";

const APP_API_ROUTES = `${APP_URL}/api/**`;

const octet = () => randomInt(1, 255);

export const uniqueClientIp = () => `10.${octet()}.${octet()}.${octet()}`;

export const assignClientIp = async (context: BrowserContext, ip = uniqueClientIp()) => {
  await context.route(APP_API_ROUTES, (route) =>
    route.continue({ headers: { ...route.request().headers(), [CLIENT_IP_HEADER]: ip } }),
  );
  return ip;
};
