import { zodResolver } from "@hookform/resolvers/zod";
import { CALL_SERIES_TARGETS } from "@passalio/shared";
import { useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useCallback, useMemo, type FormEvent } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADMIN_PRIMARY_BUTTON_CLASS } from "@/contexts/backoffice";
import { describedBy, FormField } from "@/contexts/customers";
import { departmentLabel } from "../../department-names";
import { callsFr } from "../../fr-calls";
import { useProspectFilters } from "../../hooks/use-sales-queries";
import { FIELD_CLASS, SELECT_TRIGGER_CLASS } from "../sales-styles";
import { CALL_SERIES_MAX_SIZE, CALL_SERIES_MIN_SIZE } from "./call-session";
import {
  ANY_DEPARTMENT,
  callSeriesFormSchema,
  emptyCallSeriesForm,
  toCallSeriesSearch,
  validSizeOf,
  type CallSeriesFormValues,
} from "./call-series-form-schema";

const text = callsFr.calls;

const DEFAULT_DEPARTMENT = "94";

export const CallSeriesCard = () => {
  const navigate = useNavigate();
  const filters = useProspectFilters();
  const departments = filters.data?.departments ?? [];
  const hasDefault = departments.some(({ code }) => code === DEFAULT_DEPARTMENT);
  const initial = useMemo(
    () => emptyCallSeriesForm(hasDefault ? DEFAULT_DEPARTMENT : null),
    [hasDefault],
  );
  const form = useForm<CallSeriesFormValues>({
    resolver: zodResolver(callSeriesFormSchema),
    values: initial,
    resetOptions: { keepDirtyValues: true },
  });
  const { field: department } = useController({ control: form.control, name: "department" });
  const { field: targetField } = useController({ control: form.control, name: "target" });
  const size = useWatch({ control: form.control, name: "size" });
  const validSize = validSizeOf(size);
  const sizeError = form.formState.errors.size?.message;
  const launch = useMemo(
    () =>
      form.handleSubmit(async (values) => {
        await navigate({ to: "/admin/appels/serie", search: toCallSeriesSearch(values) });
      }),
    [form, navigate],
  );
  const submit = useCallback((event: FormEvent) => void launch(event), [launch]);
  return (
    <section
      id="volume"
      aria-labelledby="volume-title"
      className="flex flex-col gap-3.5 rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-xl lg:p-[18px]"
    >
      <span className="flex flex-col gap-0.5">
        <h2 id="volume-title" className="text-[15px] font-bold">
          {text.volumeTitle}
        </h2>
        <span className="text-[13px] text-[#64748B]">{text.volumeHint}</span>
      </span>
      <form noValidate className="flex flex-col gap-3.5" onSubmit={submit}>
        <FormField id="size" label={text.size} isRequired error={sizeError}>
          <Input
            id="size"
            type="number"
            inputMode="numeric"
            min={CALL_SERIES_MIN_SIZE}
            max={CALL_SERIES_MAX_SIZE}
            aria-required="true"
            aria-invalid={sizeError !== undefined}
            aria-describedby={describedBy("size", sizeError)}
            className={FIELD_CLASS}
            {...form.register("size")}
          />
        </FormField>
        <FormField id="department" label={text.zone}>
          <Select value={department.value} onValueChange={department.onChange}>
            <SelectTrigger id="department" className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_DEPARTMENT} className="min-h-12 lg:min-h-0">
                {text.anyZone}
              </SelectItem>
              {departments.map(({ code }) => (
                <SelectItem key={code} value={code} className="min-h-12 lg:min-h-0">
                  {departmentLabel(code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="target" label={text.target}>
          <Select value={targetField.value} onValueChange={targetField.onChange}>
            <SelectTrigger id="target" className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CALL_SERIES_TARGETS.map((target) => (
                <SelectItem key={target} value={target} className="min-h-12 lg:min-h-0">
                  {callsFr.targets[target]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <Button type="submit" className={`${ADMIN_PRIMARY_BUTTON_CLASS} gap-2`}>
          <Play aria-hidden="true" className="size-3.5" strokeWidth={2} />
          {validSize === null ? text.launchInvalid : text.launch(validSize)}
        </Button>
      </form>
      <p className="text-[13px] leading-normal text-[#64748B]">{text.volumeNote}</p>
    </section>
  );
};
