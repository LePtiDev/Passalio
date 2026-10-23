import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, Clock } from "lucide-react";
import { useCallback, useEffect, useMemo, type MouseEvent } from "react";
import { useController, useForm, useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";
import {
  describedBy,
  FIELD_CLASS,
  Fieldset,
  FieldRow,
  FormField,
  FormShell,
  SELECT_TRIGGER_CLASS,
} from "@/contexts/customers";
import { FormSkeleton } from "@/components/page-skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalSession } from "@/lib/db/local-database-context";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import { createIntervention } from "../../intervention-store";
import { todayOf } from "../../planning-dates";
import type { NewVisitSearch } from "../../planning-search";
import type { Technician } from "../../technicians";
import { useChosenCustomer } from "../../hooks/use-customer-choice";
import { useNow } from "../../hooks/use-now";
import { useTechnicians } from "../../hooks/use-technicians";
import {
  emptyVisitForm,
  toInterventionFields,
  visitFormSchema,
  type VisitFormValues,
} from "../../visit-form-schema";
import { CustomerPicker } from "./customer-picker";
import { EquipmentChecklist } from "./equipment-checklist";
import { siteLabelOf } from "./site-label";

const text = schedulingFr.form;

const TRAIL = [{ label: schedulingFr.planning.title }, { label: text.title }];

const ICON_CLASS =
  "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#64748B] lg:left-3";

const PICKER_INPUT_CLASS = "pl-10 lg:pl-9 [&::-webkit-calendar-picker-indicator]:opacity-0";

const openPicker = (event: MouseEvent<HTMLInputElement>) => {
  event.currentTarget.showPicker();
};

const IconInput = ({
  id,
  type,
  label,
  icon: Icon,
  control,
  name,
}: {
  readonly id: string;
  readonly type: "date" | "time";
  readonly label: string;
  readonly icon: typeof Clock;
  readonly control: Control<VisitFormValues>;
  readonly name: "scheduledDate" | "startTime";
}) => {
  const { field, fieldState } = useController({ control, name });
  const error = fieldState.error?.message;
  return (
    <FormField id={id} label={label} isRequired error={error}>
      <div className="relative">
        <Icon aria-hidden="true" className={ICON_CLASS} />
        <Input
          {...field}
          id={id}
          type={type}
          aria-required="true"
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy(id, error)}
          onClick={openPicker}
          className={cn(FIELD_CLASS, PICKER_INPUT_CLASS)}
        />
      </div>
    </FormField>
  );
};

const TechnicianSelect = ({
  control,
  technicians,
}: {
  readonly control: Control<VisitFormValues>;
  readonly technicians: readonly Technician[];
}) => {
  const { field, fieldState } = useController({ control, name: "technicianUserId" });
  const error = fieldState.error?.message;
  return (
    <FormField id="visit-technician" label={text.technician} isRequired error={error}>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger
          id="visit-technician"
          aria-required="true"
          aria-invalid={error === undefined ? undefined : true}
          className={SELECT_TRIGGER_CLASS}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {technicians.map((technician) => (
            <SelectItem
              key={technician.userId}
              value={technician.userId}
              className="min-h-12 lg:min-h-8"
            >
              {technician.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};

const NewVisitForm = ({
  search,
  technicians,
  userId,
}: {
  readonly search: NewVisitSearch;
  readonly technicians: readonly Technician[];
  readonly userId: string;
}) => {
  const { database, actor } = useLocalSession();
  const navigate = useNavigate();
  const now = useNow();
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: emptyVisitForm({
      customerId: search.client ?? "",
      scheduledDate: search.jour ?? todayOf(now),
      technicianUserId: search.technicien ?? userId,
    }),
  });
  const { control, setValue, formState } = form;
  const customerId = useWatch({ control, name: "customerId" });
  const siteId = useWatch({ control, name: "siteId" });
  const chosen = useChosenCustomer(customerId);
  const sites = useMemo(() => chosen?.sites ?? [], [chosen]);
  const site = sites.find(({ id }) => id === siteId);
  const equipments = useMemo(
    () =>
      (chosen?.equipments ?? []).filter(
        (equipment) => equipment.siteId === siteId && equipment.status === "active",
      ),
    [chosen, siteId],
  );
  const equipmentField = useController({ control, name: "equipmentIds" }).field;
  const siteField = useController({ control, name: "siteId" });
  const firstSiteId = sites[0]?.id ?? "";
  const siteIds = sites.map(({ id }) => id).join();

  useEffect(() => {
    if (chosen !== undefined && !siteIds.split(",").includes(siteId)) {
      setValue("siteId", firstSiteId);
    }
  }, [chosen, siteIds, siteId, firstSiteId, setValue]);

  const equipmentIds = equipments.map(({ id }) => id).join();
  useEffect(() => {
    setValue("equipmentIds", equipmentIds === "" ? [] : equipmentIds.split(","));
  }, [equipmentIds, setValue]);

  const backToPlanning = useCallback(
    (day?: string) => {
      void navigate({ to: "/planning", search: day === undefined ? {} : { jour: day } });
    },
    [navigate],
  );
  const cancel = useCallback(() => backToPlanning(search.jour), [backToPlanning, search.jour]);
  const isSubmitted = formState.isSubmitted;
  const chooseCustomer = useCallback(
    (id: string) => setValue("customerId", id, { shouldValidate: isSubmitted }),
    [setValue, isSubmitted],
  );
  const submit = form.handleSubmit(async (values) => {
    try {
      await createIntervention(database, actor, toInterventionFields(values));
      toast.success(text.created);
      backToPlanning(values.scheduledDate);
    } catch {
      toast.error(text.errors.saveFailed);
    }
  });

  return (
    <FormShell
      title={text.title}
      note={text.note}
      trail={TRAIL}
      primaryLabel={text.submit}
      isSubmitting={formState.isSubmitting}
      onSubmit={submit}
      onCancel={cancel}
    >
      <Fieldset title={text.customerSection}>
        <CustomerPicker
          chosen={chosen ?? null}
          error={formState.errors.customerId?.message}
          onChoose={chooseCustomer}
        />
        {sites.length > 1 ? (
          <FormField
            id="visit-site"
            label={text.site}
            isRequired
            error={siteField.fieldState.error?.message}
          >
            <Select value={siteField.field.value} onValueChange={siteField.field.onChange}>
              <SelectTrigger id="visit-site" aria-required="true" className={SELECT_TRIGGER_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sites.map((candidate) => (
                  <SelectItem
                    key={candidate.id}
                    value={candidate.id}
                    className="min-h-12 lg:min-h-8"
                  >
                    {siteLabelOf(candidate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}
      </Fieldset>
      <Fieldset title={text.appointmentSection}>
        <div className="grid gap-4 lg:grid-cols-3">
          <IconInput
            id="visit-date"
            type="date"
            label={text.date}
            icon={CalendarDays}
            control={control}
            name="scheduledDate"
          />
          <IconInput
            id="visit-time"
            type="time"
            label={text.time}
            icon={Clock}
            control={control}
            name="startTime"
          />
          <TechnicianSelect control={control} technicians={technicians} />
        </div>
      </Fieldset>
      {chosen === null || chosen === undefined ? null : (
        <Fieldset
          title={text.equipmentsSection}
          text={site === undefined ? undefined : siteLabelOf(site)}
        >
          <EquipmentChecklist
            equipments={equipments}
            selected={equipmentField.value}
            onChange={equipmentField.onChange}
          />
        </Fieldset>
      )}
      <FieldRow>
        <FormField
          id="visit-price"
          label={text.price}
          hint={text.priceHint}
          error={formState.errors.price?.message}
        >
          <Input
            id="visit-price"
            inputMode="decimal"
            placeholder="75 €"
            aria-invalid={formState.errors.price === undefined ? undefined : true}
            aria-describedby={describedBy(
              "visit-price",
              formState.errors.price?.message,
              text.priceHint,
            )}
            className={FIELD_CLASS}
            {...form.register("price")}
          />
        </FormField>
        <FormField id="visit-notes" label={text.notes}>
          <Input
            id="visit-notes"
            placeholder={text.notesPlaceholder}
            className={FIELD_CLASS}
            {...form.register("notes")}
          />
        </FormField>
      </FieldRow>
    </FormShell>
  );
};

export const NewVisitScreen = ({ search }: { readonly search: NewVisitSearch }) => {
  const { actor } = useLocalSession();
  const team = useTechnicians();
  if (team === undefined) {
    return (
      <div className="mx-auto w-full max-w-[600px] p-4 lg:py-8">
        <FormSkeleton />
      </div>
    );
  }
  return (
    <NewVisitForm
      search={search}
      technicians={team.canPlan ? team.technicians : team.self}
      userId={actor.userId}
    />
  );
};
