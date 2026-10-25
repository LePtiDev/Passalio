import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { useNow } from "@/contexts/backoffice";
import { useFollowUp } from "../../hooks/use-call-queries";
import { useCompanyFile } from "../../hooks/use-sales-queries";
import type { QueuedCall } from "./call-session";
import { CallDeskSkeleton } from "./call-desk-skeleton";
import { LoadedCallDesk, type CallDeskActions } from "./loaded-call-desk";

type CallDeskProps = CallDeskActions & {
  readonly call: QueuedCall;
  readonly nextLabel: string | null;
};

export const CallDesk = ({ call, nextLabel, onLogged, onSkip }: CallDeskProps) => {
  const now = useNow();
  const file = useCompanyFile(call.companyId);
  const followUp = useFollowUp(call.companyId);
  const { refetch: refetchFile } = file;
  const { refetch: refetchFollowUp } = followUp;
  const retry = useCallback(() => {
    void refetchFile();
    void refetchFollowUp();
  }, [refetchFile, refetchFollowUp]);
  if (file.isError || followUp.isError) {
    return <ErrorState error={file.error ?? followUp.error} onRetry={retry} />;
  }
  if (file.data === undefined || followUp.data === undefined) {
    return <CallDeskSkeleton />;
  }
  return (
    <LoadedCallDesk
      call={call}
      file={file.data}
      followUp={followUp.data}
      now={now}
      nextLabel={nextLabel}
      onLogged={onLogged}
      onSkip={onSkip}
    />
  );
};
