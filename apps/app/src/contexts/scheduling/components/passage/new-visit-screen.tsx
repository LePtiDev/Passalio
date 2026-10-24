import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  describedBy,
  FIELD_CLASS,
  Fieldset,
  FieldRow,
  FormField,
  FormShell,
} from "@/contexts/customers";
import { FormSkeleton } from "@/components/page-skeleton";
import { Input } from "@/components/ui/input";
import { useLocalSession } from "@/lib/db/local-database-context";
import { schedulingFr } from "../../fr";
import { createIntervention } from "../../intervention-store";
import { todayOf } from "../../planning-dates";
import type { NewVisitSearch } from "../../planning-search";
import type { Technician } from "../../technicians";
import { useChosenCustomer } from "../../hooks/use-customer-choice";
import { useNow } from "../../hooks/use-now";
import { useTechnicians } from "../../hooks/use-technicians";
import { useVisitTypeChoice } from "../../hooks/use-visit-type-choice";
import {
  DEFAULT_DURATION_MINUTES,
  emptyVisitForm,
  toInterventionFields,
  visitFormSchema,
  type VisitFormValues,
} from "../../visit-form-schema";
import { DateInput, SiteSelect, TechnicianSelect, TimeInput } from "./appointment-fields";
import { CustomerPicker } from "./customer-picker";
import { DurationField } from "./duration-field";
import { EquipmentChecklist } from "./equipment-checklist";
import { siteLabelOf } from "./site-label";
import { VisitTypeField } from "./visit-type-field";

const text = schedulingFr.form;

const TRAIL = [{ label: schedulingFr.planning.title }, { label: text.title }];

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
    defaultValues: {
      ...emptyVisitForm({
        customerId: search.client ?? "",
        scheduledDate: search.jour ?? todayOf(now),
        technicianUserId: search.technicien ?? userId,
      }),
      durationMinutes: DEFAULT_DURATION_MINUTES,
    },
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
  const visitType = useVisitTypeChoice(form, equipments);
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
        {sites.length > 1 ? <SiteSelect control={control} sites={sites} /> : null}
      </Fieldset>
      <Fieldset title={text.appointmentSection}>
        {visitType.offered.length === 0 ? null : (
          <VisitTypeField
            offered={visitType.offered}
            value={visitType.chosenTypes}
            error={visitType.error}
            onChange={visitType.chooseTypes}
          />
        )}
        <div className="grid gap-4 lg:grid-cols-3">
          <DateInput control={control} />
          <TimeInput control={control} />
          <DurationField
            minutes={visitType.durationMinutes}
            chosen={visitType.chosen}
            onChange={visitType.chooseDuration}
          />
        </div>
        <TechnicianSelect control={control} technicians={technicians} />
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
