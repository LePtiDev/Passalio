import type { FormEvent } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, FormField } from "@/contexts/customers";
import { callsFr } from "../../fr-calls";
import { FIELD_CLASS, SELECT_TRIGGER_CLASS } from "../sales-styles";
import { isScheduled, type CallFormValues } from "./call-form-schema";
import { FormChoiceField, InterestField } from "./form-choice-field";
import { NEXT_ACTION_OPTIONS, NOTIFY_OPTIONS, OUTCOME_OPTIONS } from "./qualification-options";

const text = callsFr.session;

export const CALL_FORM_ID = "call-result";

type CallResultFormProps = {
  readonly isInterestShown: boolean;
  readonly hasFooter: boolean;
  readonly nextLabel: string | null;
  readonly isSaving: boolean;
  readonly onSubmit: (event: FormEvent) => void;
};

const ScheduleFields = () => {
  const { register, control, formState } = useFormContext<CallFormValues>();
  const { field: notify } = useController({ control, name: "notify" });
  const dateError = formState.errors.date?.message;
  const timeError = formState.errors.time?.message;
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,150px)] gap-2.5 lg:gap-3">
        <FormField id="call-date" label={text.date} isRequired error={dateError}>
          <Input
            id="call-date"
            type="date"
            aria-required="true"
            aria-invalid={dateError !== undefined}
            aria-describedby={describedBy("call-date", dateError)}
            className={FIELD_CLASS}
            {...register("date")}
          />
        </FormField>
        <FormField id="call-time" label={text.time} isRequired error={timeError}>
          <Input
            id="call-time"
            type="time"
            step={900}
            aria-required="true"
            aria-invalid={timeError !== undefined}
            aria-describedby={describedBy("call-time", timeError)}
            className={FIELD_CLASS}
            {...register("time")}
          />
        </FormField>
      </div>
      <FormField id="call-notify" label={text.notification}>
        <Select value={notify.value} onValueChange={notify.onChange}>
          <SelectTrigger id="call-notify" className={SELECT_TRIGGER_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTIFY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="min-h-12 lg:min-h-0">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </>
  );
};

export const CallResultForm = ({
  isInterestShown,
  hasFooter,
  nextLabel,
  isSaving,
  onSubmit,
}: CallResultFormProps) => {
  const { register, control, formState } = useFormContext<CallFormValues>();
  const [outcome, nextAction] = useWatch({ control, name: ["outcome", "nextAction"] });
  const isAnswered = outcome === "answered";
  return (
    <form
      id={CALL_FORM_ID}
      noValidate
      aria-label={text.result}
      className="flex flex-col gap-4 lg:rounded-xl lg:border lg:border-[#E3E8EF] lg:bg-white lg:px-5 lg:py-[18px]"
      onSubmit={onSubmit}
    >
      <FormChoiceField
        name="outcome"
        id="call-outcome"
        label={text.result}
        options={OUTCOME_OPTIONS}
        isRequired
      />
      {isInterestShown ? <InterestField layout="fill" /> : null}
      <FormChoiceField
        name="nextAction"
        id="call-next-action"
        label={text.nextAction}
        options={NEXT_ACTION_OPTIONS}
        isRequired={isAnswered}
      />
      {isScheduled(nextAction) ? <ScheduleFields /> : null}
      <FormField id="call-notes" label={text.notes} error={formState.errors.notes?.message}>
        <Textarea
          id="call-notes"
          rows={3}
          placeholder={text.notesPlaceholder}
          className="min-h-24 rounded-[10px] border-[#D5DDE6] bg-white px-3.5 py-3 text-base shadow-[0_1px_2px_rgba(15,42,68,0.05)] placeholder:text-[#94A3B8] lg:rounded-lg lg:px-3 lg:py-2 lg:text-[13px]"
          {...register("notes")}
        />
      </FormField>
      {hasFooter ? (
        <div className="flex items-center gap-3 border-t border-[#EEF2F6] pt-3.5">
          <span className="flex-1 truncate text-[13px] text-[#64748B]">{nextLabel}</span>
          <Button type="submit" disabled={isSaving}>
            {nextLabel === null ? text.save : text.saveAndNext}
          </Button>
        </div>
      ) : null}
    </form>
  );
};
