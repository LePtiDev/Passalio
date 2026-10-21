import type { OrganizationRole } from "@passalio/shared";
import type { Invitation, Member, Organization, TeamMember } from "./identity-models";

export type Page = {
  readonly limit: number;
  readonly afterId?: string;
};

export type OrganizationRepository = {
  readonly createWithOwner: (organization: Organization, owner: Member) => Promise<void>;
  readonly findById: (organizationId: string) => Promise<Organization | undefined>;
};

export type MemberRepository = {
  readonly list: (organizationId: string, page: Page) => Promise<readonly TeamMember[]>;
  readonly findById: (organizationId: string, memberId: string) => Promise<Member | undefined>;
  readonly findByEmail: (organizationId: string, email: string) => Promise<Member | undefined>;
  readonly findByUserId: (organizationId: string, userId: string) => Promise<Member | undefined>;
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
};

export type IdentityAuditAction =
  | "organization.created"
  | "member.invited"
  | "invitation.accepted"
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
  readonly now: () => Date;
};
