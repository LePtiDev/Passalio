import type { TeamResponse } from "@passalio/shared";
import type { TeamPage } from "../domain/team-models";

export const teamPageResponse = ({ members, invitations }: TeamPage): TeamResponse => ({
  members: members.map(({ lastSignInAt, ...member }) => ({
    ...member,
    lastSignInAt: lastSignInAt?.toISOString() ?? null,
  })),
  invitations: invitations.map(({ sentAt, expiresAt, ...invitation }) => ({
    ...invitation,
    sentAt: sentAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  })),
});
