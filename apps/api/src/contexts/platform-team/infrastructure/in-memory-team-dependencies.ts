import type { PlatformRole } from "@passalio/shared";
import type { TeamInvitation, Teammate } from "../domain/team-models";
import type { TeamAuditEntry, TeamDependencies } from "../domain/team-ports";

export type InMemoryTeamUser = Omit<Teammate, "role"> & { readonly role: PlatformRole | null };

export type InMemoryTeamNotification = {
  readonly invitation: TeamInvitation;
  readonly inviterName: string;
};

export type InMemoryTeamState = {
  readonly users: InMemoryTeamUser[];
  readonly invitations: TeamInvitation[];
  readonly auditEntries: TeamAuditEntry[];
  readonly notifications: InMemoryTeamNotification[];
};

export const createInMemoryTeamState = (): InMemoryTeamState => ({
  users: [],
  invitations: [],
  auditEntries: [],
  notifications: [],
});

export const inMemoryTeamUser = (
  user: Pick<InMemoryTeamUser, "id" | "role"> & Partial<InMemoryTeamUser>,
): InMemoryTeamUser => ({
  name: `Name ${user.id}`,
  email: `${user.id}@passalio.com`,
  isTwoFactorEnabled: false,
  lastSignInAt: null,
  ...user,
});

export const inMemoryTeamInvitation = (
  invitation: Pick<TeamInvitation, "id" | "email" | "role" | "inviterId" | "createdAt"> &
    Partial<TeamInvitation>,
): TeamInvitation => ({
  status: "pending",
  expiresAt: new Date(invitation.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
  ...invitation,
});

const replaceWhere = <Item>(
  items: Item[],
  isTarget: (item: Item) => boolean,
  update: (item: Item) => Item,
) => {
  items.forEach((item, index) => {
    if (isTarget(item)) {
      items[index] = update(item);
    }
  });
};

export const createInMemoryTeamDependencies = (
  state: InMemoryTeamState,
  now: () => Date,
  newId: () => string,
): TeamDependencies => {
  const setRole = (userId: string, role: PlatformRole | null) => {
    replaceWhere(
      state.users,
      ({ id }) => id === userId,
      (user) => ({ ...user, role }),
    );
  };
  const setInvitation = (invitationId: string, changes: Partial<TeamInvitation>) => {
    replaceWhere(
      state.invitations,
      ({ id }) => id === invitationId,
      (invitation) => ({ ...invitation, ...changes }),
    );
  };

  return {
    teammates: {
      list: async () =>
        state.users
          .flatMap(({ role, ...user }) => (role === null ? [] : [{ ...user, role }]))
          .toSorted((first, second) => first.name.localeCompare(second.name)),
      findRole: async (userId) => state.users.find(({ id }) => id === userId)?.role ?? undefined,
      findRoleByEmail: async (email) =>
        state.users.find((user) => user.email === email)?.role ?? undefined,
      changeRole: async (userId, role) => setRole(userId, role),
      remove: async (userId) => setRole(userId, null),
      findName: async (userId) => state.users.find(({ id }) => id === userId)?.name,
    },
    invitations: {
      create: async (invitation) => {
        state.invitations.push(invitation);
      },
      findById: async (invitationId) => state.invitations.find(({ id }) => id === invitationId),
      findPendingByEmail: async (email) =>
        state.invitations.find(
          (invitation) => invitation.email === email && invitation.status === "pending",
        ),
      listPending: async () =>
        state.invitations
          .filter(({ status }) => status === "pending")
          .toSorted((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
          .map(({ id, email, role, inviterId, createdAt, expiresAt }) => ({
            id,
            email,
            role,
            inviterName: state.users.find((user) => user.id === inviterId)?.name ?? null,
            sentAt: createdAt,
            expiresAt,
          })),
      renew: async (invitationId, expiresAt) => setInvitation(invitationId, { expiresAt }),
      cancel: async (invitationId) => setInvitation(invitationId, { status: "canceled" }),
      accept: async (invitation, userId) => {
        setInvitation(invitation.id, { status: "accepted" });
        replaceWhere(
          state.users,
          ({ id }) => id === userId,
          (user) => ({ ...user, role: invitation.role }),
        );
      },
    },
    auditTrail: {
      record: async (entry) => {
        state.auditEntries.push(entry);
      },
    },
    notifier: {
      notify: async (invitation, inviterName) => {
        state.notifications.push({ invitation, inviterName });
      },
    },
    now,
    newId,
  };
};
