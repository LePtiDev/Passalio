import { Mail } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { daysUntil, formatShortDate } from "@/lib/format-date";
import { identityFr, ROLE_LABELS } from "../../fr";
import { useCancelInvitation, useResendInvitation } from "../../hooks/use-pending-invitations";
import type { PendingInvitation } from "../../identity-api";

const text = identityFr.pendingInvitations;

const expiryOf = (expiresAt: Date, now: Date) => {
  const days = daysUntil(expiresAt, now);
  return days <= 0 ? text.expired : text.expiresIn(days);
};

type PendingInvitationCardProps = {
  readonly invitation: PendingInvitation;
  readonly canManage: boolean;
  readonly now: Date;
};

export const PendingInvitationCard = ({
  invitation,
  canManage,
  now,
}: PendingInvitationCardProps) => {
  const resend = useResendInvitation();
  const cancel = useCancelInvitation();
  const { id, email } = invitation;
  const { mutate: resendNow } = resend;
  const { mutate: cancelNow } = cancel;
  const onResend = useCallback(() => resendNow({ id, email }), [resendNow, id, email]);
  const onCancel = useCallback(() => cancelNow({ id, email }), [cancelNow, id, email]);
  const isBusy = resend.isPending || cancel.isPending;

  return (
    <li className="flex flex-col gap-3 rounded-[14px] border border-[#F5D9B0] bg-[#FFFBF3] p-3.5 lg:flex-row lg:items-center lg:justify-between lg:rounded-xl lg:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D9A55B] lg:size-7">
          <Mail aria-hidden="true" className="size-4 text-[#B45309]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold lg:text-[13px]">{email}</span>
          <span className="text-[13px] text-[#92400E]">
            {ROLE_LABELS[invitation.role]} · {text.sentOn(formatShortDate(invitation.sentAt))},{" "}
            {expiryOf(invitation.expiresAt, now)}
          </span>
        </span>
      </div>
      {canManage ? (
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <Button variant="secondary" disabled={isBusy} onClick={onResend}>
            {text.resend}
          </Button>
          <Button
            variant="secondary"
            className="text-destructive hover:text-destructive"
            disabled={isBusy}
            onClick={onCancel}
            aria-label={`${text.cancel} ${email}`}
          >
            <span className="lg:hidden">{text.cancelShort}</span>
            <span className="hidden lg:inline">{text.cancel}</span>
          </Button>
        </div>
      ) : null}
    </li>
  );
};
