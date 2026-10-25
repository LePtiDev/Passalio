import { zodResolver } from "@hookform/resolvers/zod";
import type {
  CallOutcome,
  ProspectCompanyFileResponse,
  ProspectFollowUpResponse,
} from "@passalio/shared";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { tomorrowOf } from "../../call-time-labels";
import { callsFr } from "../../fr-calls";
import { useLogCall, useQualify } from "../../hooks/use-call-mutations";
import { CallHistory } from "./call-history";
import {
  answeredCountOf,
  deskContactOf,
  nextQuestionOf,
  QUALIFICATION_KEYS,
  taskToCloseOf,
} from "./call-desk-model";
import { callFormSchema, emptyCallForm, toCallLog, type CallFormValues } from "./call-form-schema";
import { CallResultForm } from "./call-result-form";
import type { QueuedCall } from "./call-session";
import { ContactCard } from "./contact-card";
import { MobileDeskFooter, QualificationToggle } from "./mobile-desk-parts";
import { NextQuestion, QualificationPanel, type PanelAnswers } from "./qualification-panel";

const text = callsFr.session;

export type CallDeskActions = {
  readonly onLogged: (outcome: CallOutcome) => void;
  readonly onSkip: () => void;
};

type LoadedCallDeskProps = CallDeskActions & {
  readonly call: QueuedCall;
  readonly file: ProspectCompanyFileResponse;
  readonly followUp: ProspectFollowUpResponse;
  readonly now: Date;
  readonly nextLabel: string | null;
};

const panelAnswersOf = ({ qualification }: ProspectFollowUpResponse): PanelAnswers => ({
  teamSize: qualification.teamSize,
  toolKind: qualification.toolKind,
  certificateVolume: qualification.certificateVolume,
  decisionMaker: qualification.decisionMaker,
});

export const LoadedCallDesk = ({
  call,
  file,
  followUp,
  now,
  nextLabel,
  onLogged,
  onSkip,
}: LoadedCallDeskProps) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [isQualificationOpen, setIsQualificationOpen] = useState(false);
  const [answers, setAnswers] = useState(() => panelAnswersOf(followUp));
  const savedInterest = followUp.qualification.interest;
  const form = useForm<CallFormValues>({
    resolver: zodResolver(callFormSchema),
    defaultValues: emptyCallForm(tomorrowOf(now), savedInterest),
  });
  const interest = useWatch({ control: form.control, name: "interest" });
  const desk = useMemo(() => deskContactOf(file, call.contactId), [file, call.contactId]);
  const task = followUp.tasks.find(({ id }) => id === call.taskId) ?? null;
  const qualify = useQualify();
  const { mutate: saveAnswer } = qualify;
  const answer = useCallback(
    (change: Partial<PanelAnswers>) => {
      setAnswers((current) => ({ ...current, ...change }));
      saveAnswer({ companyId: file.company.id, qualification: change });
    },
    [file.company.id, saveAnswer],
  );
  const logCall = useLogCall();
  const { mutate: log } = logCall;
  const save = useMemo(
    () =>
      form.handleSubmit((values) => {
        const logged = toCallLog(values, desk.contact?.id ?? null);
        log(
          {
            companyId: file.company.id,
            call: logged,
            taskId: taskToCloseOf(followUp, call.taskId, now),
            interest:
              values.interest === "" || values.interest === savedInterest ? null : values.interest,
          },
          { onSuccess: () => onLogged(logged.outcome) },
        );
      }),
    [form, desk.contact, log, file.company.id, followUp, call.taskId, now, savedInterest, onLogged],
  );
  const submit = useCallback((event: FormEvent) => void save(event), [save]);
  const toggleQualification = useCallback(() => setIsQualificationOpen((isOpen) => !isOpen), []);
  const allAnswers = useMemo(
    () => ({ ...answers, interest: interest === "" ? null : interest }),
    [answers, interest],
  );
  const answeredCount = answeredCountOf(allAnswers);
  const progress = text.answered(answeredCount);
  const question = nextQuestionOf(allAnswers);
  const contactCard = (
    <ContactCard company={file.company} desk={desk} followUp={followUp} task={task} now={now} />
  );
  const history = <CallHistory calls={followUp.calls} now={now} />;
  return (
    <FormProvider {...form}>
      {isDesktop ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:grid-cols-[360px_340px_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 lg:row-span-2 xl:row-span-1">
            {contactCard}
            {history}
          </div>
          <div className="flex flex-col gap-4">
            {question === null ? null : (
              <NextQuestion
                question={callsFr.questions[question]}
                left={text.questionsLeft(QUALIFICATION_KEYS.length - answeredCount)}
              />
            )}
            <QualificationPanel
              answers={answers}
              isInterestShown
              progress={progress}
              onAnswer={answer}
            />
          </div>
          <CallResultForm
            isInterestShown={false}
            hasFooter
            nextLabel={nextLabel}
            isSaving={logCall.isPending}
            onSubmit={submit}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {contactCard}
          <CallResultForm
            isInterestShown
            hasFooter={false}
            nextLabel={nextLabel}
            isSaving={logCall.isPending}
            onSubmit={submit}
          />
          <QualificationToggle isOpen={isQualificationOpen} onToggle={toggleQualification} />
          {isQualificationOpen ? (
            <QualificationPanel
              answers={answers}
              isInterestShown={false}
              progress={progress}
              onAnswer={answer}
            />
          ) : null}
          {history}
          <MobileDeskFooter
            hasNext={nextLabel !== null}
            isSaving={logCall.isPending}
            onSkip={onSkip}
          />
        </div>
      )}
    </FormProvider>
  );
};
