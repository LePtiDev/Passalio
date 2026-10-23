import type { OrganizationRole, Result } from "@passalio/shared";
import type { CompanySummary } from "./company-summary";
import type {
  Invitation,
  Member,
  Organization,
  PendingInvitation,
  TeamMember,
} from "./identity-models";
import type {
  CompanyDetails,
  NormalizedProfileChanges,
  OrganizationProfile,
} from "./organization-profile";

export type Page = {
  readonly limit: number;
  readonly afterId?: string;
};

export type NewOrganization = Organization & CompanyDetails;

export type OrganizationRepository = {
  readonly createWithOwner: (organization: NewOrganization, owner: Member) => Promise<void>;
  readonly findById: (organizationId: string) => Promise<Organization | undefined>;
  readonly findProfile: (organizationId: string) => Promise<OrganizationProfile | undefined>;
  readonly updateProfile: (
    organizationId: string,
    changes: NormalizedProfileChanges,
  ) => Promise<void>;
  readonly setLogoKey: (organizationId: string, logoKey: string) => Promise<void>;
  readonly completeOnboarding: (organizationId: string, completedAt: Date) => Promise<void>;
};

export type StoredLogo = {
  readonly body: ReadableStream;
  readonly contentType: string;
};

export type LogoStorage = {
  readonly put: (key: string, body: ArrayBuffer, contentType: string) => Promise<void>;
  readonly get: (key: string) => Promise<StoredLogo | undefined>;
};

export type CompanyDirectory = {
  readonly search: (
    query: string,
  ) => Promise<Result<readonly CompanySummary[], "company_search_unavailable">>;
};

export type MemberRepository = {
  readonly list: (organizationId: string, page: Page) => Promise<readonly TeamMember[]>;
  readonly findById: (organizationId: string, memberId: string) => Promise<Member | undefined>;
  readonly findByEmail: (organizationId: string, email: string) => Promise<Member | undefined>;
  readonly findByUserId: (organizationId: string, userId: string) => Promise<Member | undefined>;
  readonly findName: (organizationId: string, userId: string) => Promise<string | undefined>;
  readonly updateRole: (
    organizationId: string,
    memberId: string,
    role: OrganizationRole,
  ) => Promise<void>;
  readonly remove: (organizationId: string, memberId: string) => Promise<void>;
  readonly transferOwnership: (
    organizationId: string,
    fromMemberId: string,
    toMemberId: string,
  ) => Promise<void>;
};

export type InvitationRepository = {
  readonly create: (invitation: Invitation) => Promise<void>;
  readonly findById: (
    organizationId: string,
    invitationId: string,
  ) => Promise<Invitation | undefined>;
  readonly accept: (invitation: Invitation, member: Member) => Promise<void>;
  readonly listPending: (
    organizationId: string,
    page: Page,
  ) => Promise<readonly PendingInvitation[]>;
  readonly renew: (organizationId: string, invitationId: string, expiresAt: Date) => Promise<void>;
  readonly cancel: (organizationId: string, invitationId: string) => Promise<void>;
};

export type IdentityAuditAction =
  | "organization.created"
  | "organization.updated"
  | "organization.logo_updated"
  | "organization.onboarding_completed"
  | "member.invited"
  | "invitation.accepted"
  | "invitation.resent"
  | "invitation.canceled"
  | "member.role_changed"
  | "member.removed"
  | "ownership.transferred";

export type IdentityAuditEntry = {
  readonly organizationId: string;
  readonly actorUserId: string;
  readonly action: IdentityAuditAction;
  readonly targetType: "organization" | "member" | "invitation";
  readonly targetId: string;
  readonly data?: Readonly<Record<string, string>>;
};

export type IdentityAuditTrail = {
  readonly record: (entry: IdentityAuditEntry) => Promise<void>;
};

export type InvitationNotifier = {
  readonly notify: (invitation: Invitation, organization: Organization) => Promise<void>;
};

export type IdentityDependencies = {
  readonly organizations: OrganizationRepository;
  readonly members: MemberRepository;
  readonly invitations: InvitationRepository;
  readonly auditTrail: IdentityAuditTrail;
  readonly invitationNotifier: InvitationNotifier;
  readonly logoStorage: LogoStorage;
  readonly companyDirectory: CompanyDirectory;
  readonly now: () => Date;
};
