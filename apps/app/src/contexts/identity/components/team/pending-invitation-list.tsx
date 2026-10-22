import { useState } from "react";
import type { PendingInvitation } from "../../identity-api";
import { PendingInvitationCard } from "./pending-invitation-card";

type PendingInvitationListProps = {
  readonly invitations: readonly PendingInvitation[];
  readonly canManage: boolean;
};

export const PendingInvitationList = ({ invitations, canManage }: PendingInvitationListProps) => {
  const [now] = useState(() => new Date());
  return (
    <ul className="flex flex-col gap-2.5">
      {invitations.map((invitation) => (
        <PendingInvitationCard
          key={invitation.id}
          invitation={invitation}
          canManage={canManage}
          now={now}
        />
      ))}
    </ul>
  );
};
