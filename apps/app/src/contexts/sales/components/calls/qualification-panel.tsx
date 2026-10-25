import type {
  CertificateVolume,
  DecisionMaker,
  ProspectTeamSize,
  ToolKind,
} from "@passalio/shared";
import { useCallback } from "react";
import { callsFr } from "../../fr-calls";
import { ChoiceField } from "./choice-field";
import { InterestField } from "./form-choice-field";
import type { QualificationAnswers } from "./call-desk-model";
import {
  CERTIFICATE_VOLUME_OPTIONS,
  DECISION_MAKER_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TOOL_KIND_OPTIONS,
} from "./qualification-options";

const text = callsFr.qualification;

export type PanelAnswers = Omit<QualificationAnswers, "interest">;

type QualificationPanelProps = {
  readonly answers: PanelAnswers;
  readonly isInterestShown: boolean;
  readonly progress: string;
  readonly onAnswer: (change: Partial<PanelAnswers>) => void;
};

export const QualificationPanel = ({
  answers,
  isInterestShown,
  progress,
  onAnswer,
}: QualificationPanelProps) => {
  const answerTeamSize = useCallback(
    (teamSize: ProspectTeamSize) => onAnswer({ teamSize }),
    [onAnswer],
  );
  const answerToolKind = useCallback((toolKind: ToolKind) => onAnswer({ toolKind }), [onAnswer]);
  const answerVolume = useCallback(
    (certificateVolume: CertificateVolume) => onAnswer({ certificateVolume }),
    [onAnswer],
  );
  const answerDecisionMaker = useCallback(
    (decisionMaker: DecisionMaker) => onAnswer({ decisionMaker }),
    [onAnswer],
  );
  return (
    <section
      aria-labelledby="qualification-title"
      className="flex flex-col gap-3.5 rounded-[14px] border border-[#E3E8EF] bg-white px-4 py-3.5 lg:rounded-xl lg:px-[18px] lg:py-4"
    >
      <span className="flex items-baseline justify-between gap-2">
        <h2 id="qualification-title" className="text-[15px] font-bold">
          {callsFr.session.qualification}
        </h2>
        <span className="text-xs text-[#64748B]">{progress}</span>
      </span>
      {isInterestShown ? <InterestField layout="wrap" /> : null}
      <ChoiceField
        id="qualification-team-size"
        label={text.teamSize.label}
        options={TEAM_SIZE_OPTIONS}
        value={answers.teamSize}
        onChange={answerTeamSize}
        layout="wrap"
      />
      <ChoiceField
        id="qualification-tool-kind"
        label={text.toolKind.label}
        options={TOOL_KIND_OPTIONS}
        value={answers.toolKind}
        onChange={answerToolKind}
        layout="wrap"
      />
      <ChoiceField
        id="qualification-certificate-volume"
        label={text.certificateVolume.label}
        options={CERTIFICATE_VOLUME_OPTIONS}
        value={answers.certificateVolume}
        onChange={answerVolume}
        layout="wrap"
      />
      <ChoiceField
        id="qualification-decision-maker"
        label={text.decisionMaker.label}
        options={DECISION_MAKER_OPTIONS}
        value={answers.decisionMaker}
        onChange={answerDecisionMaker}
        layout="wrap"
      />
    </section>
  );
};

export const NextQuestion = ({
  question,
  left,
}: {
  readonly question: string;
  readonly left: string;
}) => (
  <section className="flex flex-col gap-2 rounded-xl border border-[#C9E6D9] bg-white px-[18px] py-4">
    <h2 className="text-xs font-bold tracking-[0.04em] text-[#0B6B4E] uppercase">
      {callsFr.session.nextQuestion}
    </h2>
    <p className="text-[15px] leading-[1.45] font-semibold">{question}</p>
    <span className="text-[13px] text-[#64748B]">{left}</span>
  </section>
);
