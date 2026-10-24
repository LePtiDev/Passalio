import { Link } from "@tanstack/react-router";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { callsFr } from "../../fr-calls";
import type { SessionProgress } from "./session-progress";

const text = callsFr.session;

export type SessionExit = {
  readonly to: "/admin/appels" | "/admin/journee";
  readonly label: string;
};

type SessionBarProps = {
  readonly isSingle: boolean;
  readonly exit: SessionExit;
  readonly progress: SessionProgress | null;
  readonly onSkip?: (() => void) | undefined;
  readonly onFinish?: (() => void) | undefined;
};

const stepClassOf = (step: number, index: number) => {
  if (step < index) {
    return "bg-[#0E7C5A]";
  }
  return step === index ? "bg-[#0F2A44]" : "bg-[#E3E8EF]";
};

const Steps = ({ progress }: { readonly progress: SessionProgress }) => (
  <span aria-hidden="true" className="flex gap-0.5">
    {Array.from({ length: progress.total }, (_, step) => (
      <span
        key={step}
        className={cn("h-[5px] flex-1 rounded-[2px]", stepClassOf(step, progress.index))}
      />
    ))}
  </span>
);

const isRunning = (progress: SessionProgress | null): progress is SessionProgress =>
  progress !== null && !progress.isFinished;

export const SessionBar = ({ isSingle, exit, progress, onSkip, onFinish }: SessionBarProps) => {
  const title = isSingle ? text.single : text.title;
  const running = isRunning(progress) ? progress : null;
  const position = running === null ? null : text.position(running.index + 1, running.total);
  const tally = running === null ? null : text.tally(running.answered, running.voicemail);
  const hasSteps = running !== null && !isSingle;
  return (
    <header className="flex shrink-0 flex-col gap-2 border-b border-[#E3E8EF] bg-white pt-2 pr-3 pb-3 pl-1 lg:flex-row lg:items-center lg:gap-4 lg:px-8 lg:py-3.5">
      <Link
        to={exit.to}
        className="hidden items-center gap-1.5 text-[13px] font-semibold text-[#475569] hover:text-[#0F2A44] lg:inline-flex"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        {exit.label}
      </Link>
      <span className="flex items-center gap-1 lg:hidden">
        {running === null || onFinish === undefined ? (
          <Link
            to={exit.to}
            aria-label={exit.label}
            className="flex size-12 items-center justify-center"
          >
            <X aria-hidden="true" className="size-5" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label={text.close}
            className="flex size-12 items-center justify-center"
            onClick={onFinish}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
        <h1 className="flex-1 text-base font-bold">
          {running === null || isSingle
            ? title
            : text.mobilePosition(running.index + 1, running.total)}
        </h1>
        {tally === null || isSingle ? null : (
          <span className="text-[13px] text-[#64748B]">{tally}</span>
        )}
      </span>
      <span className="hidden max-w-[520px] flex-1 flex-col gap-1.5 lg:flex">
        <span className="flex justify-between gap-3 text-[13px]">
          <h1 className="font-bold">
            {position === null || isSingle ? title : `${title} · ${position}`}
          </h1>
          {tally === null || isSingle ? null : <span className="text-[#64748B]">{tally}</span>}
        </span>
        {hasSteps ? <Steps progress={running} /> : null}
      </span>
      {hasSteps ? (
        <span className="pl-3 lg:hidden">
          <Steps progress={running} />
        </span>
      ) : null}
      <span className="hidden flex-1 lg:block" />
      {running === null ? null : (
        <span className="hidden gap-2 lg:flex">
          {onSkip === undefined ? null : (
            <Button variant="secondary" onClick={onSkip}>
              {text.skip}
            </Button>
          )}
          {onFinish === undefined ? null : (
            <Button variant="secondary" onClick={onFinish}>
              {text.finish}
            </Button>
          )}
        </span>
      )}
    </header>
  );
};
