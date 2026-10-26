import { reserveNumberBlockBody, startCheckoutBody, syncPushBody } from "@passalio/shared";
import { serviceChanges, serviceFields } from "@passalio/trades";
import {
  addEquipmentBody,
  addSiteBody,
  createCustomerBody,
  removeEquipmentBody,
  updateCustomerBody,
  updateEquipmentBody,
  updateSiteBody,
} from "../../src/contexts/customers/http/customer-http-schemas";
import {
  changeMemberRoleBody,
  createOrganizationBody,
  inviteMemberBody,
  transferOwnershipBody,
  updateOrganizationBody,
} from "../../src/contexts/identity/http/identity-schemas";
import { read, withBytes, withJson, withoutBody, type SampleBuilder } from "./sample-request";

const SITE = {
  address: "3 rue des Matrices",
  postalCode: "75011",
  city: "Paris",
  buildingType: "house",
} as const;

export const COMPANY_ROUTE_SAMPLES: Readonly<Record<string, SampleBuilder>> = {
  "POST /api/organizations": () =>
    withJson("POST", "/api/organizations", createOrganizationBody, { name: "Ramonage Matrice" }),
  "POST /api/invitations/:organizationId/:invitationId/accept": (ids) =>
    withoutBody("POST", `/api/invitations/${ids.organizationId}/${ids.invitationId}/accept`),
  "GET /api/company-search": () => read("/api/company-search?q=ramonage"),
  "GET /api/team-invitations/:invitationId": (ids) =>
    read(`/api/team-invitations/${ids.teamInvitationId}`),
  "POST /api/team-invitations/:invitationId/accept": (ids) =>
    withoutBody("POST", `/api/team-invitations/${ids.teamInvitationId}/accept`),
  "GET /api/me": () => read("/api/me"),
  "GET /api/members": () => read("/api/members"),
  "POST /api/invitations": () =>
    withJson("POST", "/api/invitations", inviteMemberBody, {
      email: "invite-matrice@example.fr",
      role: "technician",
    }),
  "GET /api/invitations": () => read("/api/invitations"),
  "POST /api/invitations/:invitationId/resend": (ids) =>
    withoutBody("POST", `/api/invitations/${ids.invitationId}/resend`),
  "DELETE /api/invitations/:invitationId": (ids) =>
    withoutBody("DELETE", `/api/invitations/${ids.invitationId}`),
  "PATCH /api/members/:memberId": (ids) =>
    withJson("PATCH", `/api/members/${ids.memberId}`, changeMemberRoleBody, { role: "admin" }),
  "DELETE /api/members/:memberId": (ids) => withoutBody("DELETE", `/api/members/${ids.memberId}`),
  "POST /api/ownership-transfer": (ids) =>
    withJson("POST", "/api/ownership-transfer", transferOwnershipBody, { memberId: ids.memberId }),
  "GET /api/organization": () => read("/api/organization"),
  "PATCH /api/organization": () =>
    withJson("PATCH", "/api/organization", updateOrganizationBody, { phone: "01 23 45 67 89" }),
  "PUT /api/organization/logo": () => withBytes("PUT", "/api/organization/logo", "image/png"),
  "GET /api/organization/logo": () => read("/api/organization/logo"),
  "DELETE /api/organization/logo": () => withoutBody("DELETE", "/api/organization/logo"),
  "GET /api/organization/document-settings": () => read("/api/organization/document-settings"),
  "POST /api/organization/onboarding-completion": () =>
    withoutBody("POST", "/api/organization/onboarding-completion"),
  "POST /api/document-number-blocks": () =>
    withJson("POST", "/api/document-number-blocks", reserveNumberBlockBody, {
      deviceId: crypto.randomUUID(),
    }),
  "GET /api/services": () => read("/api/services"),
  "POST /api/services": () =>
    withJson("POST", "/api/services", serviceFields, {
      name: "Ramonage de conduit",
      durationMinutes: 60,
      priceCents: 7500,
      document: "chimney_sweeping_certificate",
      trade: "chimney_sweeping",
    }),
  "PATCH /api/services/:serviceId": () =>
    withJson("PATCH", `/api/services/${crypto.randomUUID()}`, serviceChanges, {
      priceCents: 8000,
    }),
  "POST /api/services/:serviceId/archive": () =>
    withoutBody("POST", `/api/services/${crypto.randomUUID()}/archive`),
  "GET /api/customers": () => read("/api/customers"),
  "POST /api/customers": () =>
    withJson("POST", "/api/customers", createCustomerBody, {
      customer: { kind: "individual", lastName: "Matrice" },
      site: SITE,
    }),
  "GET /api/customers/:customerId": (ids) => read(`/api/customers/${ids.customerId}`),
  "PATCH /api/customers/:customerId": (ids) =>
    withJson("PATCH", `/api/customers/${ids.customerId}`, updateCustomerBody, {
      lastName: "Intrus",
    }),
  "DELETE /api/customers/:customerId": (ids) =>
    withoutBody("DELETE", `/api/customers/${ids.customerId}`),
  "POST /api/customers/:customerId/sites": (ids) =>
    withJson("POST", `/api/customers/${ids.customerId}/sites`, addSiteBody, SITE),
  "PATCH /api/sites/:siteId": (ids) =>
    withJson("PATCH", `/api/sites/${ids.siteId}`, updateSiteBody, { city: "Intrusville" }),
  "POST /api/sites/:siteId/equipments": (ids) =>
    withJson("POST", `/api/sites/${ids.siteId}/equipments`, addEquipmentBody, { kind: "boiler" }),
  "PATCH /api/equipments/:equipmentId": (ids) =>
    withJson("PATCH", `/api/equipments/${ids.equipmentId}`, updateEquipmentBody, {
      brand: "Intrus",
    }),
  "POST /api/equipments/:equipmentId/removal": (ids) =>
    withJson("POST", `/api/equipments/${ids.equipmentId}/removal`, removeEquipmentBody, {}),
  "POST /api/equipments/:equipmentId/photos": (ids) =>
    withBytes("POST", `/api/equipments/${ids.equipmentId}/photos?kind=plate`, "image/jpeg"),
  "GET /api/photos/:photoId": (ids) => read(`/api/photos/${ids.photoId}`),
  "POST /api/plate-readings": () => withBytes("POST", "/api/plate-readings", "image/jpeg"),
  "GET /api/billing/subscription": () => read("/api/billing/subscription"),
  "POST /api/billing/checkout": () =>
    withJson("POST", "/api/billing/checkout", startCheckoutBody, {
      plan: "team",
      interval: "month",
    }),
  "POST /api/billing/portal": () => withoutBody("POST", "/api/billing/portal"),
  "GET /api/billing/seats": () => read("/api/billing/seats"),
  "GET /api/billing/invoices": () => read("/api/billing/invoices"),
  "POST /api/sync/push": (ids) =>
    withJson("POST", "/api/sync/push", syncPushBody, {
      mutations: [
        {
          id: crypto.randomUUID(),
          mutation: {
            type: "update_customer",
            customerId: ids.customerId,
            changes: { lastName: "Intrus" },
          },
        },
      ],
    }),
  "GET /api/sync/pull": () => read("/api/sync/pull"),
};
