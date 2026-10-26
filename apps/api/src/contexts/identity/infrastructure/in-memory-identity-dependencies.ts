import { DEFAULT_BRAND_COLOR, DEFAULT_DOCUMENT_TEMPLATE, ok } from "@passalio/shared";
import type { CompanySummary } from "../domain/company-summary";
import type { IdentityAuditEntry, IdentityDependencies } from "../domain/identity-ports";
import type { Invitation, Member, TeamMember } from "../domain/identity-models";
import type { OrganizationProfile } from "../domain/organization-profile";

export type InMemoryUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
};

export type InMemoryIdentityState = {
  readonly users: InMemoryUser[];
  readonly organizations: OrganizationProfile[];
  readonly members: Member[];
  readonly invitations: Invitation[];
  readonly auditEntries: IdentityAuditEntry[];
  readonly notifiedInvitations: Invitation[];
  readonly logos: Map<string, string>;
  readonly companies: CompanySummary[];
  readonly signUp?: { isOpen: boolean };
  readonly fullTechnicianSeats?: ReadonlySet<string>;
};

export const createInMemoryIdentityState = (): InMemoryIdentityState => ({
  users: [],
  organizations: [],
  members: [],
  invitations: [],
  auditEntries: [],
  notifiedInvitations: [],
  logos: new Map(),
  companies: [],
});

export const inMemoryOrganization = (
  organization: Pick<OrganizationProfile, "id" | "name" | "slug"> & Partial<OrganizationProfile>,
): OrganizationProfile => ({
  siret: null,
  address: null,
  phone: null,
  teamSize: null,
  trades: [],
  brandColor: DEFAULT_BRAND_COLOR,
  documentNumberPrefix: "",
  nextDocumentNumber: 1,
  legalForm: null,
  shareCapitalEuros: null,
  registryKind: null,
  registryCity: null,
  apeCode: null,
  qualification: null,
  documentTemplate: DEFAULT_DOCUMENT_TEMPLATE,
  contactEmail: null,
  website: null,
  customerMessage: null,
  footerText: null,
  logoKey: null,
  onboardingCompletedAt: null,
  hasReservedNumbers: false,
  ...organization,
});

const replaceWhere = <T>(items: T[], predicate: (item: T) => boolean, update: (item: T) => T) => {
  items.forEach((item, index) => {
    if (predicate(item)) {
      items[index] = update(item);
    }
  });
};

const inOrganization = (organizationId: string) => (member: Member) =>
  member.organizationId === organizationId;

export const createInMemoryIdentityDependencies = (
  state: InMemoryIdentityState,
  now: () => Date = () => new Date(),
): IdentityDependencies => {
  const withUser = (member: Member): TeamMember[] => {
    const user = state.users.find(({ id }) => id === member.userId);
    return user === undefined
      ? []
      : [{ ...member, name: user.name, email: user.email, joinedAt: now() }];
  };

  return {
    signUpPolicy: { isOpen: async () => state.signUp?.isOpen ?? true },
    technicianSeats: {
      hasFreeSeat: async (organizationId) => !state.fullTechnicianSeats?.has(organizationId),
    },
    organizations: {
      createWithOwner: async (organization, owner) => {
        state.organizations.push(inMemoryOrganization(organization));
        state.members.push(owner);
      },
      findById: async (organizationId) => {
        const found = state.organizations.find(({ id }) => id === organizationId);
        return found === undefined
          ? undefined
          : { id: found.id, name: found.name, slug: found.slug };
      },
      findProfile: async (organizationId) =>
        state.organizations.find(({ id }) => id === organizationId),
      updateProfile: async (organizationId, changes) => {
        replaceWhere(
          state.organizations,
          ({ id }) => id === organizationId,
          (organization) => ({ ...organization, ...changes }),
        );
      },
      setLogoKey: async (organizationId, logoKey) => {
        replaceWhere(
          state.organizations,
          ({ id }) => id === organizationId,
          (organization) => ({ ...organization, logoKey }),
        );
      },
      completeOnboarding: async (organizationId, completedAt) => {
        replaceWhere(
          state.organizations,
          ({ id, onboardingCompletedAt }) =>
            id === organizationId && onboardingCompletedAt === null,
          (organization) => ({ ...organization, onboardingCompletedAt: completedAt }),
        );
      },
    },
    members: {
      list: async (organizationId, { limit, afterId }) =>
        state.members
          .filter(inOrganization(organizationId))
          .filter(({ id }) => afterId === undefined || id > afterId)
          .toSorted((left, right) => left.id.localeCompare(right.id))
          .slice(0, limit)
          .flatMap(withUser),
      findById: async (organizationId, memberId) =>
        state.members.filter(inOrganization(organizationId)).find(({ id }) => id === memberId),
      findByUserId: async (organizationId, userId) =>
        state.members
          .filter(inOrganization(organizationId))
          .find((member) => member.userId === userId),
      findName: async (organizationId, userId) => {
        const member = state.members
          .filter(inOrganization(organizationId))
          .find((candidate) => candidate.userId === userId);
        return member === undefined ? undefined : withUser(member)[0]?.name;
      },
      findByEmail: async (organizationId, email) =>
        state.members
          .filter(inOrganization(organizationId))
          .find((member) => withUser(member)[0]?.email === email),
      updateRole: async (organizationId, memberId, role) => {
        replaceWhere(
          state.members,
          (member) => member.organizationId === organizationId && member.id === memberId,
          (member) => ({ ...member, role }),
        );
      },
      remove: async (organizationId, memberId) => {
        const index = state.members.findIndex(
          (member) => member.organizationId === organizationId && member.id === memberId,
        );
        if (index >= 0) {
          state.members.splice(index, 1);
        }
      },
      transferOwnership: async (organizationId, fromMemberId, toMemberId) => {
        replaceWhere(
          state.members,
          (member) => member.organizationId === organizationId && member.id === toMemberId,
          (member): Member => ({ ...member, role: "owner" }),
        );
        replaceWhere(
          state.members,
          (member) => member.organizationId === organizationId && member.id === fromMemberId,
          (member): Member => ({ ...member, role: "admin" }),
        );
      },
    },
    invitations: {
      create: async (invitation) => {
        state.invitations.push(invitation);
      },
      findById: async (organizationId, invitationId) =>
        state.invitations.find(
          (invitation) =>
            invitation.organizationId === organizationId && invitation.id === invitationId,
        ),
      accept: async (invitation, member) => {
        replaceWhere(
          state.invitations,
          ({ id }) => id === invitation.id,
          (current): Invitation => ({ ...current, status: "accepted" }),
        );
        state.members.push(member);
      },
      listPending: async (organizationId, { limit, afterId }) =>
        state.invitations
          .filter(
            (invitation) =>
              invitation.organizationId === organizationId && invitation.status === "pending",
          )
          .filter(({ id }) => afterId === undefined || id > afterId)
          .toSorted((left, right) => left.id.localeCompare(right.id))
          .slice(0, limit)
          .map(({ id, email, role, expiresAt }) => ({ id, email, role, expiresAt, sentAt: now() })),
      renew: async (organizationId, invitationId, expiresAt) => {
        replaceWhere(
          state.invitations,
          (invitation) =>
            invitation.organizationId === organizationId && invitation.id === invitationId,
          (invitation) => ({ ...invitation, expiresAt }),
        );
      },
      cancel: async (organizationId, invitationId) => {
        replaceWhere(
          state.invitations,
          (invitation) =>
            invitation.organizationId === organizationId && invitation.id === invitationId,
          (invitation): Invitation => ({ ...invitation, status: "canceled" }),
        );
      },
    },
    auditTrail: {
      record: async (entry) => {
        state.auditEntries.push(entry);
      },
    },
    invitationNotifier: {
      notify: async (invitation) => {
        state.notifiedInvitations.push(invitation);
      },
    },
    logoStorage: {
      put: async (key, _body, contentType) => {
        state.logos.set(key, contentType);
      },
      get: async (key) => {
        const contentType = state.logos.get(key);
        return contentType === undefined ? undefined : { body: new Blob([]).stream(), contentType };
      },
      delete: async (key) => {
        state.logos.delete(key);
      },
    },
    companyDirectory: {
      search: async (query) =>
        ok(state.companies.filter(({ name }) => name.toLowerCase().includes(query.toLowerCase()))),
    },
    now,
  };
};
