import type { CallOutcome } from "@passalio/shared";
import { useCallback, useState, type ReactNode } from "react";
import { ErrorState } from "@/components/error-state";
import { callsFr } from "../../fr-calls";
import { CallDesk } from "./call-desk";
import { CallDeskSkeleton } from "./call-desk-skeleton";
import type { CallSession, QueuedCall } from "./call-session";
import { SessionBar, type SessionExit } from "./session-bar";
import { nextProgress, startProgress, type SessionStep } from "./session-progress";
import { SessionDone, SessionEmpty } from "./session-states";
import { useCallQueue } from "./use-call-queue";

const text = callsFr.session;

const CALLS_EXIT: SessionExit = { to: "/admin/appels", label: text.back };

const DAY_EXIT: SessionExit = { to: "/admin/journee", label: text.myDay };

const SessionFrame = ({ children }: { readonly children: ReactNode }) => (
  <div className="fixed inset-0 z-40 flex flex-col bg-white text-[#0F2A44] lg:bg-[#F7F9FB]">
    {children}
  </div>
);

const SessionBody = ({ children }: { readonly children: ReactNode }) => (
  <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-4 pb-4 has-[[data-sticky-footer]]:pb-0 lg:px-8 lg:py-5">
    {children}
  </div>
);

type SessionRunProps = {
  readonly calls: readonly QueuedCall[];
  readonly isSingle: boolean;
  readonly exit: SessionExit;
};

const SessionRun = ({ calls, isSingle, exit }: SessionRunProps) => {
  const [progress, setProgress] = useState(() => startProgress(calls.length));
  const step = useCallback(
    (next: SessionStep) => setProgress((current) => nextProgress(current, next)),
    [],
  );
  const log = useCallback((outcome: CallOutcome) => step({ type: "logged", outcome }), [step]);
  const skip = useCallback(() => step({ type: "skipped" }), [step]);
  const finish = useCallback(() => step({ type: "finished" }), [step]);
  const current = calls[progress.index];
  const next = calls[progress.index + 1];
  return (
    <SessionFrame>
      <SessionBar
        isSingle={isSingle}
        exit={exit}
        progress={progress}
        onSkip={isSingle ? undefined : skip}
        onFinish={finish}
      />
      <SessionBody>
        {calls.length === 0 ? <SessionEmpty /> : null}
        {calls.length > 0 && (progress.isFinished || current === undefined) ? (
          <SessionDone progress={progress} />
        ) : null}
        {current !== undefined && !progress.isFinished ? (
          <CallDesk
            key={`${progress.index}-${current.companyId}`}
            call={current}
            nextLabel={next === undefined ? null : text.next(next.name ?? "")}
            onLogged={log}
            onSkip={isSingle ? finish : skip}
          />
        ) : null}
      </SessionBody>
    </SessionFrame>
  );
};

export const CallSessionScreen = ({ session }: { readonly session: CallSession }) => {
  const queue = useCallQueue(session);
  const isSingle = session.kind === "single";
  const exit = session.kind === "day" ? DAY_EXIT : CALLS_EXIT;
  if (queue.status === "ready") {
    return <SessionRun calls={queue.calls} isSingle={isSingle} exit={exit} />;
  }
  return (
    <SessionFrame>
      <SessionBar isSingle={isSingle} exit={exit} progress={null} />
      <SessionBody>
        {queue.status === "pending" ? (
          <CallDeskSkeleton />
        ) : (
          <ErrorState error={queue.error} onRetry={queue.retry} />
        )}
      </SessionBody>
    </SessionFrame>
  );
};
