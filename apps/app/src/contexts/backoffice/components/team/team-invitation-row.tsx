import type { PendingTeamInvitationResponse } from "@passalio/shared";
import { Mail } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { useCancelTeamInvitation, useResendTeamInvitation } from "../../hooks/use-platform-team";
import { teamFr } from "../../team-fr";
import { ADMIN_SECONDARY_BUTTON_CLASS } from "../admin-styles";
import { RoleBadge } from "./role-badge";
import { daysLeft } from "./team-labels";
import { TEAM_GRID_CLASS, TEAM_ROW_CLASS } from "./team-styles";

type TeamInvitationRowProps = {
  readonly invitation: PendingTeamInvitationResponse;
  readonly now: Date;
};

export const TeamInvitationRow = ({ invitation, now }: TeamInvitationRowProps) => {
  const resend = useResendTeamInvitation();
  const cancel = useCancelTeamInvitation();
  const { mutate: resendNow } = resend;
  const { mutate: cancelNow } = cancel;
  const resendInvitation = useCallback(
    () => resendNow({ invitationId: invitation.id, email: invitation.email }),
    [resendNow, invitation],
  );
  const cancelInvitation = useCallback(
    () => cancelNow({ invitationId: invitation.id, email: invitation.email }),
    [cancelNow, invitation],
  );
  const sentOn = formatShortDate(new Date(invitation.sentAt));
  const remaining = daysLeft(invitation.expiresAt, now);
  return (
    <li className={cn(TEAM_GRID_CLASS, TEAM_ROW_CLASS)}>
      <span className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F7F9FB] text-[#64748B] lg:size-7"
        >
          <Mail className="size-4 lg:size-3.5" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] font-semibold lg:text-[13px]">
              {invitation.email}
            </span>
            <span className="lg:hidden">
              <RoleBadge role={invitation.role} />
            </span>
          </span>
          <span className="truncate text-[13px] text-[#64748B]">
            {invitation.inviterName === null
              ? teamFr.invitedOn(sentOn)
              : teamFr.invitedBy(invitation.inviterName, sentOn)}
            <span className="lg:hidden"> · {teamFr.expiresIn(remaining)}</span>
          </span>
        </span>
      </span>
      <span className="hidden lg:flex">
        <RoleBadge role={invitation.role} />
      </span>
      <span
        className={cn(
          "hidden text-[13px] font-medium lg:block",
          remaining <= 1 ? "text-[#B42318]" : "text-[#B45309]",
        )}
      >
        {teamFr.expiresIn(remaining)}
      </span>
      <span className="hidden text-[13px] text-[#64748B] lg:block">{teamFr.afterJoining}</span>
      <span className="col-span-2 flex justify-end gap-1.5 lg:col-span-1">
        <Button
          variant="outline"
          className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "flex-1 lg:flex-none")}
          disabled={resend.isPending}
          onClick={resendInvitation}
        >
          {teamFr.resend}
        </Button>
        <Button
          variant="outline"
          className={cn(
            ADMIN_SECONDARY_BUTTON_CLASS,
            "flex-1 text-[#B42318] hover:text-[#B42318] lg:flex-none",
          )}
          disabled={cancel.isPending}
          onClick={cancelInvitation}
        >
          {teamFr.cancel}
        </Button>
      </span>
    </li>
  );
};
