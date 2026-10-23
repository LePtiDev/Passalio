import type { OrganizationRole } from "@passalio/shared";
import { toast } from "sonner";
import { vi } from "vitest";
import type {
  OrganizationProfile,
  PendingInvitation,
  TeamMember,
} from "@/contexts/identity/identity-api";
import type { TurnstileApi } from "@/lib/turnstile";
import { jsonReply, type FakeApi, type FakeReply, type FakeRoutes } from "./fake-api";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "./sync-replies";

export const CURRENT_USER_ID = "user-1";

export const TRACE_ID = "7b3e9c1d-2f4a-4b6c-8d0e-1a2b3c4d5e6f";

export const SHORT_TRACE_ID = TRACE_ID.slice(0, 8);

export const ME_ROUTE = "GET /api/me";
export const ORGANIZATION_ROUTE = "GET /api/organization";
export const MEMBERS_ROUTE = "GET /api/members";
export const INVITATIONS_ROUTE = "GET /api/invitations";
export const SESSION_ROUTE = "GET /api/auth/get-session";
export const SET_ACTIVE_ORGANIZATION_ROUTE = "POST /api/auth/organization/set-active";
export const SIGN_OUT_ROUTE = "POST /api/auth/sign-out";

export const noContentReply = (): FakeReply => ({ status: 204, body: null });

export const authErrorReply = (code: string, status: number, traceId = TRACE_ID): FakeReply =>
  jsonReply({ code, message: code, traceId }, status);

type ActorOptions = {
  readonly isImpersonating?: boolean;
};

export const actorReply = (role: OrganizationRole, options: ActorOptions = {}) =>
  jsonReply({
    actor: {
      userId: CURRENT_USER_ID,
      organizationId: "organization-1",
      role,
      isImpersonating: options.isImpersonating ?? false,
    },
  });

export const organizationProfile = (
  overrides: Partial<OrganizationProfile> = {},
): OrganizationProfile => ({
  id: "organization-1",
  name: "Ramonage Dupont",
  siret: "12345678900012",
  address: "12 rue des Lilas, 69003 Lyon",
  phone: null,
  teamSize: "2_to_5",
  trades: ["chimney_sweeping"],
  brandColor: "#0F2A44",
  documentNumberPrefix: "2026-",
  nextDocumentNumber: 1,
  hasLogo: false,
  isOnboardingCompleted: true,
  ...overrides,
});

export const organizationReply = (overrides: Partial<OrganizationProfile> = {}) =>
  jsonReply({ organization: organizationProfile(overrides) });

export const teamMember = (
  overrides: Partial<TeamMember> & Pick<TeamMember, "id" | "name">,
): TeamMember => ({
  userId: `user-of-${overrides.id}`,
  email: `${overrides.id}@exemple.fr`,
  role: "technician",
  joinedAt: new Date("2026-09-01T08:00:00.000Z"),
  ...overrides,
});

export const TEAM: Readonly<Record<OrganizationRole, TeamMember>> = {
  owner: teamMember({
    id: "member-paul",
    name: "Paul Dupont",
    email: "paul@ramonage-dupont.fr",
    role: "owner",
  }),
  admin: teamMember({ id: "member-claire", name: "Claire Martin", role: "admin" }),
  secretary: teamMember({ id: "member-sophie", name: "Sophie Leroy", role: "secretary" }),
  technician: teamMember({ id: "member-luc", name: "Luc Bernard", role: "technician" }),
};

export const teamSeenBy = (role: OrganizationRole): readonly TeamMember[] =>
  Object.values(TEAM).map((member) =>
    member.role === role ? { ...member, userId: CURRENT_USER_ID } : member,
  );

export const aloneAs = (role: OrganizationRole): readonly TeamMember[] => [
  { ...TEAM[role], userId: CURRENT_USER_ID },
];

export const membersReply = (members: readonly TeamMember[], nextCursor: string | null = null) =>
  jsonReply({ members, nextCursor });

export const pendingInvitation = (
  overrides: Partial<PendingInvitation> & Pick<PendingInvitation, "id" | "email">,
): PendingInvitation => ({
  role: "technician",
  sentAt: new Date(Date.now() - 86_400_000),
  expiresAt: new Date(Date.now() + 6 * 86_400_000),
  ...overrides,
});

export const invitationsReply = (
  invitations: readonly PendingInvitation[],
  nextCursor: string | null = null,
) => jsonReply({ invitations, nextCursor });

export const signedInRoutes = (role: OrganizationRole): FakeRoutes => ({
  [SYNC_PULL_ROUTE]: pulledChangesReply(),
  [SESSION_ROUTE]: jsonReply(null),
  [ME_ROUTE]: actorReply(role),
});

export const signedOutRoutes = (): FakeRoutes => ({
  [SYNC_PULL_ROUTE]: pulledChangesReply(),
  [SESSION_ROUTE]: jsonReply(null),
});

type TurnstileOptions = {
  readonly isPassing?: boolean;
};

type RenderOptions = Parameters<TurnstileApi["render"]>[1];

export const CAPTCHA_TOKEN = "turnstile-token";

export const installTurnstile = (options: TurnstileOptions = {}) => {
  const isPassing = options.isPassing ?? true;
  const rendered: RenderOptions[] = [];
  const turnstile: TurnstileApi = {
    render: vi.fn<TurnstileApi["render"]>((_container, renderOptions) => {
      rendered.push(renderOptions);
      if (isPassing) {
        queueMicrotask(() => renderOptions.callback(CAPTCHA_TOKEN));
      }
      return "turnstile-widget";
    }),
    reset: vi.fn<TurnstileApi["reset"]>(),
    remove: vi.fn<TurnstileApi["remove"]>(),
  };
  vi.stubGlobal("turnstile", turnstile);
  return {
    ...turnstile,
    failChallenge: () => {
      for (const renderOptions of rendered) {
        renderOptions["error-callback"]();
      }
    },
  };
};

export const forgetToasts = () => {
  toast.dismiss();
};

const headersOf = (init: RequestInit | undefined) => new Headers(init?.headers);

export const headerSentTo = (api: FakeApi, path: string, name: string) => {
  const call = api.fetch.mock.calls.find(([input]) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return new URL(url, "http://localhost").pathname === path;
  });
  return call === undefined ? undefined : headersOf(call[1]).get(name);
};
