import { MapPin } from "lucide-react";
import { useCallback, useState } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BUILDING_TYPE_LABELS, customersFr } from "../../fr";
import { useAddressSearch, type AddressSuggestion } from "../../hooks/use-address-search";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { FIELD_CLASS } from "../customer-styles";
import { AddressSuggestions } from "./address-suggestions";
import { SegmentedControl } from "./choice-controls";
import type { SiteFormValues } from "./customer-form-schema";
import { FieldRow } from "./form-shell";
import { describedBy, FormField } from "./form-field";

const text = customersFr.form;

const BUILDING_CHOICES = Object.entries(BUILDING_TYPE_LABELS).map(([value, label]) => ({
  value: value === "house" || value === "apartment" ? value : "business",
  label,
}));

const SEARCH_DELAY_MS = 300;

const NO_SUGGESTIONS: readonly AddressSuggestion[] = [];

type SiteForm = { readonly site: SiteFormValues };

const BuildingTypeField = () => {
  const { field } = useController<SiteForm, "site.buildingType">({ name: "site.buildingType" });
  return (
    <SegmentedControl
      label={text.buildingType}
      choices={BUILDING_CHOICES}
      value={field.value}
      onChange={field.onChange}
    />
  );
};

export const SiteFields = ({ hasSiteDetails }: { readonly hasSiteDetails: boolean }) => {
  const form = useFormContext<SiteForm>();
  const errors = form.formState.errors.site;
  const [isManual, setManual] = useState(!navigator.onLine);
  const [isPicked, setPicked] = useState(form.getValues("site.city") !== "");
  const address = useWatch({ control: form.control, name: "site.address" });
  const debounced = useDebouncedValue(address, SEARCH_DELAY_MS);
  const search = useAddressSearch(debounced, !isManual && !isPicked);
  const hasSuggestions = !isManual && !isPicked && debounced.trim().length >= 3;
  const showsLocality =
    isManual || isPicked || errors?.postalCode !== undefined || errors?.city !== undefined;

  const pick = useCallback(
    (suggestion: AddressSuggestion) => {
      const options = { shouldValidate: true, shouldDirty: true };
      form.setValue("site.address", suggestion.address, options);
      form.setValue("site.postalCode", suggestion.postalCode, options);
      form.setValue("site.city", suggestion.city, options);
      form.setValue("site.latitude", suggestion.latitude);
      form.setValue("site.longitude", suggestion.longitude);
      setPicked(true);
    },
    [form],
  );
  const enterManually = useCallback(() => setManual(true), []);
  const addressField = form.register("site.address", {
    onChange: () => {
      setPicked(false);
      form.setValue("site.latitude", null);
      form.setValue("site.longitude", null);
    },
  });

  return (
    <>
      {hasSiteDetails ? (
        <FormField id="site-label" label={text.siteLabel} isOptional>
          <Input
            id="site-label"
            placeholder={text.siteLabelPlaceholder}
            className={FIELD_CLASS}
            {...form.register("site.label")}
          />
        </FormField>
      ) : null}
      <FormField id="site-address" label={text.address} error={errors?.address?.message}>
        <span className="relative flex items-center">
          <MapPin
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 size-4 text-[#94A3B8] lg:left-3"
          />
          <Input
            id="site-address"
            autoComplete="off"
            aria-invalid={errors?.address !== undefined}
            aria-describedby={describedBy("site-address", errors?.address?.message)}
            className={cn(FIELD_CLASS, "pl-10 lg:pl-9")}
            {...addressField}
          />
        </span>
      </FormField>
      {hasSuggestions ? (
        <AddressSuggestions
          suggestions={search.data ?? NO_SUGGESTIONS}
          onPick={pick}
          onManualEntry={enterManually}
        />
      ) : null}
      {showsLocality ? (
        <FieldRow>
          <FormField
            id="site-postal-code"
            label={text.postalCode}
            error={errors?.postalCode?.message}
          >
            <Input
              id="site-postal-code"
              inputMode="numeric"
              autoComplete="postal-code"
              aria-invalid={errors?.postalCode !== undefined}
              className={cn(FIELD_CLASS, "tabular-nums")}
              {...form.register("site.postalCode")}
            />
          </FormField>
          <FormField id="site-city" label={text.city} error={errors?.city?.message}>
            <Input
              id="site-city"
              autoComplete="address-level2"
              aria-invalid={errors?.city !== undefined}
              className={FIELD_CLASS}
              {...form.register("site.city")}
            />
          </FormField>
        </FieldRow>
      ) : null}
      <FormField id="site-details" label={text.addressDetails} isOptional>
        <Input
          id="site-details"
          placeholder={text.addressDetailsPlaceholder}
          className={FIELD_CLASS}
          {...form.register("site.addressDetails")}
        />
      </FormField>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold lg:text-[13px]">{text.buildingType}</span>
        <BuildingTypeField />
      </div>
      <FormField id="site-access" label={text.accessNotes} isOptional>
        <Input
          id="site-access"
          placeholder={text.accessNotesPlaceholder}
          className={FIELD_CLASS}
          {...form.register("site.accessNotes")}
        />
      </FormField>
      {hasSiteDetails ? (
        <FieldRow>
          <FormField id="site-occupant" label={text.occupantName} isOptional>
            <Input
              id="site-occupant"
              className={FIELD_CLASS}
              {...form.register("site.occupantName")}
            />
          </FormField>
          <FormField
            id="site-occupant-phone"
            label={text.occupantPhone}
            isOptional
            error={errors?.occupantPhone?.message}
          >
            <Input
              id="site-occupant-phone"
              type="tel"
              inputMode="tel"
              className={FIELD_CLASS}
              {...form.register("site.occupantPhone")}
            />
          </FormField>
        </FieldRow>
      ) : null}
    </>
  );
};
