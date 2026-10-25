import type { CallOutcome, ProspectCallResponse } from "@passalio/shared";
import { whenLabel } from "../../call-time-labels";
import { callsFr } from "../../fr-calls";

const text = callsFr.session;

const DOT_COLOR: Readonly<Record<CallOutcome, string>> = {
  answered: "bg-[#0E7C5A]",
  no_answer: "bg-[#94A3B8]",
  voicemail: "bg-[#0F2A44]",
  wrong_number: "bg-[#B42318]",
};

export const CallHistory = ({
  calls,
  now,
}: {
  readonly calls: readonly ProspectCallResponse[];
  readonly now: Date;
}) => (
  <section
    aria-labelledby="call-history"
    className="flex flex-col gap-3 rounded-[14px] border border-[#E3E8EF] bg-white px-4 py-3.5 lg:rounded-xl lg:px-[18px] lg:py-4"
  >
    <h2 id="call-history" className="text-[15px] font-bold">
      {text.history}
    </h2>
    {calls.length === 0 ? (
      <p className="text-[13px] text-[#64748B]">{text.historyEmpty}</p>
    ) : (
      <ol className="flex flex-col gap-3">
        {calls.map((call) => (
          <li key={call.id} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className={`mt-[5px] size-2 shrink-0 rounded-full ${DOT_COLOR[call.outcome]}`}
            />
            <span className="flex min-w-0 flex-col gap-0.5 text-[13px]">
              <span className="text-xs text-[#64748B]">
                {text.historyWhen(
                  whenLabel(new Date(call.calledAt), now),
                  call.author?.name ?? null,
                )}
              </span>
              <span className="font-semibold">
                {text.historyWhat(
                  callsFr.outcomes[call.outcome],
                  call.nextAction === null ? null : callsFr.nextActions[call.nextAction],
                )}
              </span>
              {call.notes === null ? null : (
                <span className="leading-normal break-words text-[#475569]">{call.notes}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    )}
  </section>
);
