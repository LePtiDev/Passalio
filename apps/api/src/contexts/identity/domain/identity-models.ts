import type { OrganizationRole } from "@passalio/shared";

export type UserActor = {
  readonly userId: string;
  readonly email: string;
  readonly isImpersonating: boolean;
};

export type Organization = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export type Member = {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: OrganizationRole;
};

export type TeamMember = Member & {
  readonly name: string;
  readonly email: string;
  readonly joinedAt: Date;
};

export type InvitationStatus = "pending" | "accepted" | "rejected" | "canceled";

export type Invitation = {
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly role: OrganizationRole;
  readonly status: InvitationStatus;
  readonly inviterId: string;
  readonly expiresAt: Date;
};

export type PendingInvitation = Pick<Invitation, "id" | "email" | "role" | "expiresAt"> & {
  readonly sentAt: Date;
};
