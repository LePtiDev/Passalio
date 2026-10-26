import {
  billingRedirectResponse,
  billingSeatsResponse,
  invoicesResponse,
  ok,
  subscriptionResponse,
  teamUpgradePreviewResponse,
  type StartCheckoutBody,
  type UpgradeToTeamBody,
} from "@passalio/shared";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";

const subscriptionBody = z.object({ subscription: subscriptionResponse });
const seatsBody = z.object({ seats: billingSeatsResponse });
const previewBody = z.object({ preview: teamUpgradePreviewResponse });

export const billingApi = {
  fetchSubscription: async () => {
    const result = await apiRequest("/billing/subscription", subscriptionBody);
    return result.isOk ? ok(result.value.subscription) : result;
  },
  fetchSeats: async () => {
    const result = await apiRequest("/billing/seats", seatsBody);
    return result.isOk ? ok(result.value.seats) : result;
  },
  fetchInvoices: async () => {
    const result = await apiRequest("/billing/invoices", invoicesResponse);
    return result.isOk ? ok(result.value.invoices) : result;
  },
  startCheckout: (body: StartCheckoutBody) =>
    apiRequest("/billing/checkout", billingRedirectResponse, { method: "POST", body }),
  openPortal: () => apiRequest("/billing/portal", billingRedirectResponse, { method: "POST" }),
  previewTeamUpgrade: async () => {
    const result = await apiRequest("/billing/team-upgrade/preview", previewBody, {
      method: "POST",
    });
    return result.isOk ? ok(result.value.preview) : result;
  },
  upgradeToTeam: (body: UpgradeToTeamBody) =>
    apiRequest("/billing/team-upgrade", z.undefined(), { method: "POST", body }),
};
