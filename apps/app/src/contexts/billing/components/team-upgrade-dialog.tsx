import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROLE_LABELS, type TeamPlanUpgradeProps } from "@/contexts/identity";
import { apiErrorOf } from "@/lib/api-client";
import { errorCodeLine } from "@/lib/errors";
import { billingFr } from "../billing-fr";
import { useTeamUpgradePreview, useUpgradeToTeam } from "../hooks/use-team-upgrade";
import {
  TeamUpgradeAmount,
  TeamUpgradeAmountError,
  TeamUpgradeAmountSkeleton,
} from "./team-upgrade-amount";

const text = billingFr.teamUpgrade;

export const TeamUpgradeDialog = ({ invitee, onCancel, onUpgraded }: TeamPlanUpgradeProps) => {
  const preview = useTeamUpgradePreview();
  const upgrade = useUpgradeToTeam();
  const [isSubmitting, setSubmitting] = useState(false);
  const { refetch } = preview;
  const retry = useCallback(() => void refetch(), [refetch]);

  const closeOnDismiss = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && !isSubmitting) {
        onCancel();
      }
    },
    [isSubmitting, onCancel],
  );

  const prorationDate = preview.data?.prorationDate;
  const confirm = useCallback(async () => {
    if (prorationDate === undefined) {
      return;
    }
    setSubmitting(true);
    const isUpgraded = await upgrade.mutateAsync(prorationDate).then(
      () => true,
      () => false,
    );
    if (isUpgraded) {
      await onUpgraded();
    }
    setSubmitting(false);
  }, [onUpgraded, prorationDate, upgrade]);

  return (
    <Dialog open onOpenChange={closeOnDismiss}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[rgba(15,42,68,0.3)]"
        className="gap-4 rounded-[12px] border-0 p-6 leading-[normal] text-[#0F2A44] shadow-[0_10px_30px_rgba(15,42,68,0.15)] sm:max-w-[500px]"
      >
        <DialogHeader className="gap-2 text-left sm:text-left">
          <DialogTitle className="text-[18px] leading-[normal] font-semibold">
            {text.title}
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-[1.5] text-[#475569] lg:text-[14px]">
            {text.text(invitee.email, ROLE_LABELS[invitee.role].toLowerCase())}
          </DialogDescription>
        </DialogHeader>
        {preview.isPending ? <TeamUpgradeAmountSkeleton /> : null}
        {preview.isError ? (
          <TeamUpgradeAmountError
            codeLine={errorCodeLine(apiErrorOf(preview.error))}
            onRetry={retry}
          />
        ) : null}
        {preview.data === undefined ? null : <TeamUpgradeAmount preview={preview.data} />}
        <p className="text-[14px] text-[#64748B] lg:text-[13px]">{text.secretaryNote}</p>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {text.cancel}
          </Button>
          <Button onClick={confirm} disabled={prorationDate === undefined || isSubmitting}>
            {isSubmitting ? text.confirming : text.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
