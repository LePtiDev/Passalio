import {
  mailboxTestResponse,
  mailSettingsResponse,
  type MailSettingsChange,
} from "@passalio/shared";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";

const BASE = "/admin/mail-settings";

export const mailSettingsApi = {
  fetch: (userId: string) => apiRequest(`${BASE}/${userId}`, mailSettingsResponse),
  save: (userId: string, change: MailSettingsChange) =>
    apiRequest(`${BASE}/${userId}`, z.undefined(), { method: "PUT", body: change }),
  test: (userId: string) =>
    apiRequest(`${BASE}/${userId}/test`, mailboxTestResponse, { method: "POST" }),
};
