import { ORGANIZATION_ROLES } from "@passalio/shared";
import type { Invitation } from "../domain/identity-models";
import {
  inMemoryOrganization,
  type InMemoryIdentityState,
} from "./in-memory-identity-dependencies";

export const memberIdOf = (role: string, organizationId: string) =>
  `member-${role}-${organizationId}`;

export const seedOrganizationOf = (
  state: InMemoryIdentityState,
  organizationId: string,
  userSuffix = "",
) => {
  state.organizations.push(
    inMemoryOrganization({
      id: organizationId,
      name: `Ramonage ${organizationId}`,
      slug: `ramonage-${organizationId}`,
    }),
  );
  ORGANIZATION_ROLES.forEach((role) => {
    const userId = `user-${role}${userSuffix}`;
    state.users.push({
      id: userId,
      name: `Name ${role}`,
      email: `${role}${userSuffix}@example.fr`,
    });
    state.members.push({ id: memberIdOf(role, organizationId), organizationId, userId, role });
  });
};

export const inMemoryInvitation = (
  invitation: Pick<Invitation, "id" | "organizationId"> & Partial<Invitation>,
): Invitation => ({
  email: `${invitation.id}@example.fr`,
  role: "technician",
  status: "pending",
  inviterId: "user-owner",
  expiresAt: new Date("2026-10-30T10:00:00Z"),
  ...invitation,
});
