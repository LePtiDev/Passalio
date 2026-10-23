import { backofficeFr } from "../../fr";
import { shortDay } from "../../calendar-labels";

type TrialStatusProps = {
  readonly isInTrial: boolean;
  readonly trialEndsAt: string;
};

const text = backofficeFr.status;

export const TrialStatus = ({ isInTrial, trialEndsAt }: TrialStatusProps) => (
  <span className="flex min-w-0 flex-col gap-px">
    <span className="flex items-center gap-1.5 text-[13px] font-medium">
      <span
        aria-hidden="true"
        className={
          isInTrial ? "size-2 rounded-full bg-[#94A3B8]" : "size-2 rounded-full bg-[#B45309]"
        }
      />
      {isInTrial ? text.trial : text.trialEnded}
    </span>
    <span className="truncate text-xs text-[#64748B]">
      {isInTrial ? text.trialEnds(shortDay(trialEndsAt)) : text.trialEndedOn(shortDay(trialEndsAt))}
    </span>
  </span>
);
