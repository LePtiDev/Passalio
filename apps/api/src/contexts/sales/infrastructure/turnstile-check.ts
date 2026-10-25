import * as z from "zod";
import type { AntiRobotCheck } from "../domain/website-callback-ports";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const siteverifyResponse = z.object({ success: z.boolean() });

export const createTurnstileCheck = (secretKey: string): AntiRobotCheck => ({
  isHuman: async (token, { ipAddress }) => {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ipAddress ?? undefined,
      }),
    });
    const parsed = siteverifyResponse.safeParse(await response.json());
    return parsed.success && parsed.data.success;
  },
});
