import { zodResolver } from "@hookform/resolvers/zod";
import { SERVICE_DOCUMENTS } from "@passalio/trades";
import { Archive, Timer } from "lucide-react";
import { useCallback } from "react";
import { useController, useForm } from "react-hook-form";
import {
  describedBy,
  FIELD_CLASS,
  FormField,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  SELECT_TRIGGER_CLASS,
} from "@/contexts/customers";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDuration, schedulingFr, SERVICE_DOCUMENT_LABELS } from "../../fr";
import { serviceFormSchema, type ServiceFormValues } from "../../service-form-schema";
import { SERVICE_DURATION_CHOICES } from "../../services";

const text = schedulingFr.services;

const ITEM_CLASS = "min-h-12 lg:min-h-8";

export type ServiceFormProps = {
  readonly initial: ServiceFormValues;
  readonly isExisting: boolean;
  readonly isSaving: boolean;
  readonly isArchiving: boolean;
  readonly saveError: unknown;
  readonly onSave: (values: ServiceFormValues) => void;
  readonly onArchive: () => void;
};

const DurationSelect = ({
  value,
  onChange,
}: {
  readonly value: number;
  readonly onChange: (minutes: number) => void;
}) => {
  const choose = useCallback((choice: string) => onChange(Number(choice)), [onChange]);
  return (
    <Select value={String(value)} onValueChange={choose}>
      <SelectTrigger
        id="service-duration"
        aria-required="true"
        className={cn(SELECT_TRIGGER_CLASS, "gap-2")}
      >
        <Timer aria-hidden="true" className="size-4 shrink-0 text-[#64748B]" />
        <span className="flex-1 text-left">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {SERVICE_DURATION_CHOICES.map((choice) => (
          <SelectItem key={choice} value={String(choice)} className={ITEM_CLASS}>
            {formatDuration(choice)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const ServiceForm = ({
  initial,
  isExisting,
  isSaving,
  isArchiving,
  saveError,
  onSave,
  onArchive,
}: ServiceFormProps) => {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: initial,
  });
  const { errors } = form.formState;
  const duration = useController({ control: form.control, name: "durationMinutes" }).field;
  const document = useController({ control: form.control, name: "document" }).field;
  const submit = form.handleSubmit(onSave);
  const retry = useCallback(() => void submit(), [submit]);
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <FormField id="service-name" label={text.name} isRequired error={errors.name?.message}>
        <Input
          id="service-name"
          placeholder={text.namePlaceholder}
          aria-required="true"
          aria-invalid={errors.name === undefined ? undefined : true}
          aria-describedby={describedBy("service-name", errors.name?.message)}
          className={FIELD_CLASS}
          {...form.register("name")}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="service-duration" label={text.duration} isRequired>
          <DurationSelect value={duration.value} onChange={duration.onChange} />
        </FormField>
        <FormField
          id="service-price"
          label={text.price}
          hint={text.priceHint}
          error={errors.price?.message}
        >
          <Input
            id="service-price"
            inputMode="decimal"
            placeholder="75 €"
            aria-invalid={errors.price === undefined ? undefined : true}
            aria-describedby={describedBy("service-price", errors.price?.message, text.priceHint)}
            className={FIELD_CLASS}
            {...form.register("price")}
          />
        </FormField>
      </div>
      <FormField id="service-document" label={text.document} isRequired hint={text.documentHint}>
        <Select value={document.value} onValueChange={document.onChange}>
          <SelectTrigger
            id="service-document"
            aria-required="true"
            aria-describedby={describedBy("service-document", undefined, text.documentHint)}
            className={SELECT_TRIGGER_CLASS}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_DOCUMENTS.map((kind) => (
              <SelectItem key={kind} value={kind} className={ITEM_CLASS}>
                {SERVICE_DOCUMENT_LABELS[kind]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      {isExisting ? <p className="text-sm text-[#64748B]">{text.keepsPlanned}</p> : null}
      {saveError === null ? null : (
        <ErrorState error={saveError} message={text.saveFailed} onRetry={retry} />
      )}
      <div className="flex flex-col gap-2 lg:flex-row-reverse">
        <Button
          type="submit"
          disabled={isSaving}
          className={cn(PRIMARY_BUTTON_CLASS, "w-full lg:w-auto")}
        >
          {text.save}
        </Button>
        {isExisting ? (
          <Button
            type="button"
            variant="outline"
            onClick={onArchive}
            disabled={isArchiving}
            className={cn(SECONDARY_BUTTON_CLASS, "w-full text-[#B42318] lg:mr-auto lg:w-auto")}
          >
            <Archive aria-hidden="true" className="size-4" />
            {text.archive}
          </Button>
        ) : null}
      </div>
    </form>
  );
};
