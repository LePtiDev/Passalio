import type { Permission, PlatformPermission } from "@passalio/shared";

export type RouteMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "ALL";

export type ForeignResourceStatus = 403 | 404;

type RouteLocation = { readonly method: RouteMethod; readonly path: string };

export type InfrastructureRoute = RouteLocation & {
  readonly access: "middleware" | "public" | "auth-proxy" | "mcp-bearer";
};

export type UserRoute = RouteLocation & {
  readonly access: "user";
  readonly foreignResourceStatus: ForeignResourceStatus | null;
  readonly callsExternalService: boolean;
};

export type MemberRoute = RouteLocation & {
  readonly access: "member";
  readonly permission: Permission | null;
  readonly foreignResourceStatus: ForeignResourceStatus | null;
};

export type PlatformRoute = RouteLocation & {
  readonly access: "platform";
  readonly permission: PlatformPermission | null;
};

export type DeclaredRoute = InfrastructureRoute | UserRoute | MemberRoute | PlatformRoute;

export type SessionRoute = UserRoute | MemberRoute | PlatformRoute;

const infrastructure = (
  method: RouteMethod,
  path: string,
  access: InfrastructureRoute["access"],
): InfrastructureRoute => ({ method, path, access });

const user = (
  method: RouteMethod,
  path: string,
  foreignResourceStatus: ForeignResourceStatus | null = null,
  callsExternalService = false,
): UserRoute => ({ method, path, access: "user", foreignResourceStatus, callsExternalService });

const member = (
  method: RouteMethod,
  path: string,
  permission: Permission | null,
  foreignResourceStatus: ForeignResourceStatus | null = null,
): MemberRoute => ({ method, path, access: "member", permission, foreignResourceStatus });

const platform = (
  method: RouteMethod,
  path: string,
  permission: PlatformPermission | null,
): PlatformRoute => ({ method, path, access: "platform", permission });

const PROSPECTS = "/api/admin/prospects";

export const DECLARED_ROUTES: readonly DeclaredRoute[] = [
  infrastructure("ALL", "/*", "middleware"),
  infrastructure("ALL", "/api/*", "middleware"),
  infrastructure("ALL", "/api/admin/*", "middleware"),
  infrastructure("ALL", "/api/admin/prospects/*", "middleware"),
  infrastructure("ALL", "/api/admin/team/*", "middleware"),
  infrastructure("ALL", "/api/admin/mcp/authorization/*", "middleware"),
  infrastructure("ALL", "/api/team-invitations/*", "middleware"),
  infrastructure("GET", "/health", "public"),
  infrastructure("GET", "/.well-known/oauth-protected-resource", "public"),
  infrastructure("GET", "/.well-known/oauth-protected-resource/mcp", "public"),
  infrastructure("ALL", "/api/auth/*", "auth-proxy"),
  infrastructure("ALL", "/mcp", "mcp-bearer"),

  user("POST", "/api/organizations"),
  user("POST", "/api/invitations/:organizationId/:invitationId/accept", 403),
  user("GET", "/api/company-search", null, true),
  user("GET", "/api/team-invitations/:invitationId"),
  user("POST", "/api/team-invitations/:invitationId/accept"),

  member("GET", "/api/me", null),
  member("GET", "/api/members", "members:read"),
  member("POST", "/api/invitations", "members:manage"),
  member("GET", "/api/invitations", "members:read"),
  member("POST", "/api/invitations/:invitationId/resend", "members:manage", 404),
  member("DELETE", "/api/invitations/:invitationId", "members:manage", 404),
  member("PATCH", "/api/members/:memberId", "members:manage", 404),
  member("DELETE", "/api/members/:memberId", "members:manage", 404),
  member("POST", "/api/ownership-transfer", "ownership:transfer", 404),
  member("GET", "/api/organization", "organization:read"),
  member("PATCH", "/api/organization", "organization:update"),
  member("PUT", "/api/organization/logo", "organization:update"),
  member("GET", "/api/organization/logo", "organization:read"),
  member("POST", "/api/organization/onboarding-completion", "organization:update"),
  member("GET", "/api/customers", "customers:read"),
  member("POST", "/api/customers", "customers:write"),
  member("GET", "/api/customers/:customerId", "customers:read", 404),
  member("PATCH", "/api/customers/:customerId", "customers:write", 404),
  member("DELETE", "/api/customers/:customerId", "customers:archive", 404),
  member("POST", "/api/customers/:customerId/sites", "customers:write", 404),
  member("PATCH", "/api/sites/:siteId", "customers:write", 404),
  member("POST", "/api/sites/:siteId/equipments", "customers:write", 404),
  member("PATCH", "/api/equipments/:equipmentId", "customers:write", 404),
  member("POST", "/api/equipments/:equipmentId/removal", "customers:write", 404),
  member("POST", "/api/equipments/:equipmentId/photos", "customers:write", 404),
  member("GET", "/api/photos/:photoId", "customers:read", 404),
  member("POST", "/api/sync/push", "customers:write"),
  member("GET", "/api/sync/pull", "customers:read"),

  platform("GET", "/api/admin/me", null),
  platform("GET", "/api/admin/overview", "platform:read"),
  platform("GET", "/api/admin/accounts", "platform:read"),
  platform("GET", "/api/admin/accounts/:organizationId", "platform:read"),
  platform("GET", "/api/admin/accounts/:organizationId/members", "platform:read"),
  platform("GET", "/api/admin/accounts/:organizationId/usage", "platform:read"),
  platform("GET", "/api/admin/accounts/:organizationId/journal", "platform:read"),
  platform("GET", "/api/admin/journal", "platform:read"),
  platform("GET", `${PROSPECTS}/filters`, "prospects:read"),
  platform("GET", `${PROSPECTS}/map`, "prospects:read"),
  platform("GET", `${PROSPECTS}/companies`, "prospects:read"),
  platform("POST", `${PROSPECTS}/companies`, "prospects:write"),
  platform("GET", `${PROSPECTS}/companies/:companyId`, "prospects:read"),
  platform("PATCH", `${PROSPECTS}/companies/:companyId`, "prospects:write"),
  platform("DELETE", `${PROSPECTS}/companies/:companyId`, "prospects:write"),
  platform("POST", `${PROSPECTS}/companies/:companyId/stage`, "prospects:write"),
  platform("POST", `${PROSPECTS}/companies/:companyId/notes`, "prospects:write"),
  platform("POST", `${PROSPECTS}/companies/:companyId/contacts`, "prospects:write"),
  platform("GET", `${PROSPECTS}/contacts`, "prospects:read"),
  platform("GET", `${PROSPECTS}/contacts/:contactId`, "prospects:read"),
  platform("PATCH", `${PROSPECTS}/contacts/:contactId`, "prospects:write"),
  platform("DELETE", `${PROSPECTS}/contacts/:contactId`, "prospects:write"),
  platform("GET", "/api/admin/team", "team:manage"),
  platform("POST", "/api/admin/team/invitations", "team:manage"),
  platform("POST", "/api/admin/team/invitations/:invitationId/resend", "team:manage"),
  platform("DELETE", "/api/admin/team/invitations/:invitationId", "team:manage"),
  platform("PATCH", "/api/admin/team/members/:userId", "team:manage"),
  platform("DELETE", "/api/admin/team/members/:userId", "team:manage"),
  platform("GET", "/api/admin/mcp/authorization", "mcp:connect"),
  platform("POST", "/api/admin/mcp/authorization", "mcp:connect"),
  platform("POST", "/api/admin/mcp/authorization/denial", "mcp:connect"),
];

export const routeKey = ({ method, path }: { method: string; path: string }): string =>
  `${method} ${path}`;

const READ_METHODS: ReadonlySet<RouteMethod> = new Set(["GET"]);

export const isWriteRoute = ({ method }: RouteLocation): boolean =>
  method !== "ALL" && !READ_METHODS.has(method);

const isUserRoute = (route: DeclaredRoute): route is UserRoute => route.access === "user";

const isMemberRoute = (route: DeclaredRoute): route is MemberRoute => route.access === "member";

const isPlatformRoute = (route: DeclaredRoute): route is PlatformRoute =>
  route.access === "platform";

export const USER_ROUTES = DECLARED_ROUTES.filter(isUserRoute);
export const MEMBER_ROUTES = DECLARED_ROUTES.filter(isMemberRoute);
export const PLATFORM_ROUTES = DECLARED_ROUTES.filter(isPlatformRoute);
export const SESSION_ROUTES: readonly SessionRoute[] = [
  ...USER_ROUTES,
  ...MEMBER_ROUTES,
  ...PLATFORM_ROUTES,
];
