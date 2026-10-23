import {
  inferAdditionalFields,
  magicLinkClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [
    magicLinkClient(),
    organizationClient(),
    inferAdditionalFields({
      user: {
        termsVersion: { type: "number", required: true },
        termsAcceptedAt: { type: "date", required: false, input: false },
      },
    }),
  ],
});
