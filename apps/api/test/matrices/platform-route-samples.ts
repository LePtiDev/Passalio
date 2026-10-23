import {
  changeTeammateRoleBody,
  inviteTeammateBody,
  mcpApprovalBody,
  mcpDenialBody,
  prospectCompanyChanges,
  prospectCompanyFields,
  prospectContactChanges,
  prospectContactFields,
  prospectNote,
  prospectStageChange,
} from "@passalio/shared";
import { read, withJson, withoutBody, type SampleBuilder } from "./sample-request";

const PROSPECTS = "/api/admin/prospects";

export const PLATFORM_ROUTE_SAMPLES: Readonly<Record<string, SampleBuilder>> = {
  "GET /api/admin/me": () => read("/api/admin/me"),
  "GET /api/admin/overview": () => read("/api/admin/overview"),
  "GET /api/admin/accounts": () => read("/api/admin/accounts"),
  "GET /api/admin/accounts/:organizationId": (ids) =>
    read(`/api/admin/accounts/${ids.organizationId}`),
  "GET /api/admin/accounts/:organizationId/members": (ids) =>
    read(`/api/admin/accounts/${ids.organizationId}/members`),
  "GET /api/admin/accounts/:organizationId/usage": (ids) =>
    read(`/api/admin/accounts/${ids.organizationId}/usage`),
  "GET /api/admin/accounts/:organizationId/journal": (ids) =>
    read(`/api/admin/accounts/${ids.organizationId}/journal`),
  "GET /api/admin/journal": () => read("/api/admin/journal"),
  [`GET ${PROSPECTS}/filters`]: () => read(`${PROSPECTS}/filters`),
  [`GET ${PROSPECTS}/map`]: () => read(`${PROSPECTS}/map?department=75`),
  [`GET ${PROSPECTS}/companies`]: () => read(`${PROSPECTS}/companies`),
  [`POST ${PROSPECTS}/companies`]: () =>
    withJson("POST", `${PROSPECTS}/companies`, prospectCompanyFields, {
      name: "Ramonage Prospect Matrice",
      department: "75",
    }),
  [`GET ${PROSPECTS}/companies/:companyId`]: (ids) =>
    read(`${PROSPECTS}/companies/${ids.companyId}`),
  [`PATCH ${PROSPECTS}/companies/:companyId`]: (ids) =>
    withJson("PATCH", `${PROSPECTS}/companies/${ids.companyId}`, prospectCompanyChanges, {
      city: "Paris",
    }),
  [`DELETE ${PROSPECTS}/companies/:companyId`]: (ids) =>
    withoutBody("DELETE", `${PROSPECTS}/companies/${ids.companyId}`),
  [`POST ${PROSPECTS}/companies/:companyId/stage`]: (ids) =>
    withJson("POST", `${PROSPECTS}/companies/${ids.companyId}/stage`, prospectStageChange, {
      stage: "qualified",
    }),
  [`POST ${PROSPECTS}/companies/:companyId/notes`]: (ids) =>
    withJson("POST", `${PROSPECTS}/companies/${ids.companyId}/notes`, prospectNote, {
      body: "Rappeler lundi",
    }),
  [`POST ${PROSPECTS}/companies/:companyId/contacts`]: (ids) =>
    withJson("POST", `${PROSPECTS}/companies/${ids.companyId}/contacts`, prospectContactFields, {
      lastName: "Dupont",
    }),
  [`GET ${PROSPECTS}/contacts`]: () => read(`${PROSPECTS}/contacts`),
  [`GET ${PROSPECTS}/contacts/:contactId`]: (ids) => read(`${PROSPECTS}/contacts/${ids.contactId}`),
  [`PATCH ${PROSPECTS}/contacts/:contactId`]: (ids) =>
    withJson("PATCH", `${PROSPECTS}/contacts/${ids.contactId}`, prospectContactChanges, {
      jobTitle: "Gérant",
    }),
  [`DELETE ${PROSPECTS}/contacts/:contactId`]: (ids) =>
    withoutBody("DELETE", `${PROSPECTS}/contacts/${ids.contactId}`),
  "GET /api/admin/team": () => read("/api/admin/team"),
  "POST /api/admin/team/invitations": () =>
    withJson("POST", "/api/admin/team/invitations", inviteTeammateBody, {
      email: "recrue-matrice@passalio.com",
      role: "sales",
    }),
  "POST /api/admin/team/invitations/:invitationId/resend": (ids) =>
    withoutBody("POST", `/api/admin/team/invitations/${ids.teamInvitationId}/resend`),
  "DELETE /api/admin/team/invitations/:invitationId": (ids) =>
    withoutBody("DELETE", `/api/admin/team/invitations/${ids.teamInvitationId}`),
  "PATCH /api/admin/team/members/:userId": (ids) =>
    withJson("PATCH", `/api/admin/team/members/${ids.teammateUserId}`, changeTeammateRoleBody, {
      role: "sales",
    }),
  "DELETE /api/admin/team/members/:userId": (ids) =>
    withoutBody("DELETE", `/api/admin/team/members/${ids.teammateUserId}`),
  "GET /api/admin/mcp/authorization": () => read("/api/admin/mcp/authorization"),
  "POST /api/admin/mcp/authorization": () =>
    withJson("POST", "/api/admin/mcp/authorization", mcpApprovalBody, {
      handle: "poignee-matrice",
      access: "read",
    }),
  "POST /api/admin/mcp/authorization/denial": () =>
    withJson("POST", "/api/admin/mcp/authorization/denial", mcpDenialBody, {
      handle: "poignee-matrice",
    }),
};
