import { newId } from "@passalio/shared";
import type { CatalogedQuery } from "./cataloged-query";
import { aTeamInvitation, LATER } from "./domain-fixtures";

export const PLATFORM_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "auditTrail.record",
    query: "write an audit log",
    run: (r, s) =>
      r.auditTrail.record({
        organizationId: s.organization.id,
        actorUserId: s.owner.id,
        action: "customer.archived",
      }),
  },
  {
    method: "activityLog.recordDay",
    query: "record an active day",
    run: (r, s) => r.activityLog.recordDay(s.owner.id, LATER),
  },
  {
    method: "authSessions.getSession",
    query: "session of every authenticated request",
    run: (r, s) => r.authSessions.getSession(s.sessionCookie),
  },
  {
    method: "mcp.findCaller",
    query: "MCP caller",
    run: (r, s) => r.mcp.findCaller(s.superadmin.id),
  },
  {
    method: "mcp.countCall",
    query: "MCP rate limit",
    run: (r, s) => r.mcp.countCall(s.superadmin.id, LATER),
  },
  { method: "teammates.list", query: "Passalio team", run: (r) => r.teammates.list() },
  {
    method: "teammates.findRole",
    query: "platform role of a user",
    run: (r, s) => r.teammates.findRole(s.superadmin.id),
  },
  {
    method: "teammates.findRoleByEmail",
    query: "platform role by e-mail",
    run: (r, s) => r.teammates.findRoleByEmail(s.salesperson.email),
  },
  {
    method: "teammates.changeRole",
    query: "change a platform role",
    run: (r, s) => r.teammates.changeRole(s.salesperson.id, "sales"),
  },
  {
    method: "teammates.remove",
    query: "remove a teammate",
    run: (r) => r.teammates.remove(newId()),
  },
  {
    method: "teammates.findName",
    query: "name of a teammate",
    run: (r, s) => r.teammates.findName(s.superadmin.id),
  },
  {
    method: "teamInvitations.create",
    query: "invite a teammate",
    run: (r, s) => r.teamInvitations.create(aTeamInvitation(s.superadmin.id)),
  },
  {
    method: "teamInvitations.findById",
    query: "find a team invitation",
    run: (r, s) => r.teamInvitations.findById(s.teamInvitation.id),
  },
  {
    method: "teamInvitations.findPendingByEmail",
    query: "pending team invitation by e-mail",
    run: (r, s) => r.teamInvitations.findPendingByEmail(s.teamInvitation.email),
  },
  {
    method: "teamInvitations.listPending",
    query: "pending team invitations",
    run: (r) => r.teamInvitations.listPending(),
  },
  {
    method: "teamInvitations.renew",
    query: "resend a team invitation",
    run: (r, s) => r.teamInvitations.renew(s.teamInvitation.id, LATER),
  },
  {
    method: "teamInvitations.cancel",
    query: "cancel a team invitation",
    run: (r) => r.teamInvitations.cancel(newId()),
  },
  {
    method: "teamInvitations.accept",
    query: "accept a team invitation",
    run: (r, s) => r.teamInvitations.accept(aTeamInvitation(s.superadmin.id), s.salesperson.id),
  },
  {
    method: "platformSettings.findSignUpSettings",
    query: "is sign-up open, on every sign-up and new company",
    run: (r) => r.platformSettings.findSignUpSettings(),
  },
  {
    method: "platformSettings.saveSignUpSettings",
    query: "open or close sign-up",
    run: (r, s) =>
      r.platformSettings.saveSignUpSettings({
        isSignUpOpen: false,
        changedAt: LATER,
        changedByUserId: s.superadmin.id,
      }),
  },
  {
    method: "pendingInvitations.hasPendingInvitation",
    query: "pending company or team invitation of a person who signs up while sign-up is closed",
    run: (r, s) => r.pendingInvitations.hasPendingInvitation(s.teamInvitation.email, LATER),
  },
];
