import { signUpSettingsResponse } from "@passalio/shared";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";

const settingsBody = z.object({ settings: signUpSettingsResponse });

export const settingsApi = {
  fetchSignUp: () => apiRequest("/admin/settings/sign-up", settingsBody),
  changeSignUp: (isSignUpOpen: boolean) =>
    apiRequest("/admin/settings/sign-up", settingsBody, {
      method: "PUT",
      body: { isSignUpOpen },
    }),
};
