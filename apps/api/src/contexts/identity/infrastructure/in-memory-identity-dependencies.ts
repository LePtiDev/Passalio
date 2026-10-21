import type { IdentityAuditEntry, IdentityDependencies } from "../domain/identity-ports";
import type { Invitation, Member, Organization, TeamMember } from "../domain/identity-models";

export type InMemoryUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
};

export type InMemoryIdentityState = {
  readonly users: InMemoryUser[];
  readonly organizations: Organization[];
  readonly members: Member[];
  readonly invitations: Invitation[];
  readonly auditEntries: IdentityAuditEntry[];
  readonly notifiedInvitations: Invitation[];
};

export const createInMemoryIdentityState = (): InMemoryIdentityState => ({
  users: [],
  organizations: [],
  members: [],
  invitations: [],
  auditEntries: [],
  notifiedInvitations: [],
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
    return user === undefined ? [] : [{ ...member, name: user.name, email: user.email }];
  };

  return {
    organizations: {
      createWithOwner: async (organization, owner) => {
        state.organizations.push(organization);
        state.members.push(owner);
      },
      findById: async (organizationId) =>
        state.organizations.find(({ id }) => id === organizationId),
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
    now,
  };
};
