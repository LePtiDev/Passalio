import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unwrap } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { succeeds } from "@/lib/succeeds";
import { identityApi, type CompanySummary, type OrganizationProfile } from "../../identity-api";
import { onboardingFr } from "../../onboarding-fr";
import { AuthField, authFieldErrorId } from "../auth-field";
import { AUTH_FIELD_CLASS } from "../auth-styles";
import { CompanySearch } from "./company-search";
import {
  companyFormSchema,
  type CompanyFormInput,
  type CompanyFormValues,
} from "./company-form-schema";
import { formatSiret, toDisplayName } from "./display-name";
import { OnboardingBody, OnboardingFooter, OnboardingHeading } from "./onboarding-layout";
import { ONBOARDING_PATHS } from "./onboarding-steps";
import { ONBOARDING_PRIMARY_BUTTON_CLASS } from "./onboarding-styles";
import { TeamSizeSelect } from "./team-size-select";

const text = onboardingFr.company;

const defaultValuesOf = (organization: OrganizationProfile | null): CompanyFormInput => ({
  name: organization?.name ?? "",
  siret:
    organization?.siret === null || organization === null ? "" : formatSiret(organization.siret),
  address: organization?.address ?? "",
  phone: organization?.phone ?? "",
  teamSize: organization?.teamSize ?? null,
});

const toNewOrganization = (values: CompanyFormValues) => ({
  name: values.name,
  siret: values.siret === "" ? null : values.siret,
  address: values.address === "" ? null : values.address,
  phone: values.phone === "" ? null : values.phone,
  teamSize: values.teamSize,
});

const useSaveCompany = (organization: OrganizationProfile | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      const details = toNewOrganization(values);
      if (organization !== null) {
        unwrap(await identityApi.updateOrganization(details));
        return;
      }
      const { organization: created } = unwrap(await identityApi.createOrganization(details));
      await authClient.organization.setActive({ organizationId: created.id });
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });
};

export const CompanyStep = ({
  organization,
}: {
  readonly organization: OrganizationProfile | null;
}) => {
  const navigate = useNavigate();
  const saveCompany = useSaveCompany(organization);
  const form = useForm<CompanyFormInput, unknown, CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: defaultValuesOf(organization),
  });

  const fillFromDirectory = useCallback(
    (company: CompanySummary) => {
      const options = { shouldValidate: true, shouldDirty: true };
      form.setValue("name", toDisplayName(company.name), options);
      form.setValue("siret", formatSiret(company.siret), options);
      form.setValue("address", toDisplayName(company.address), options);
    },
    [form],
  );
  const focusName = useCallback(() => form.setFocus("name"), [form]);

  const submit = form.handleSubmit(async (values) => {
    if (await succeeds(saveCompany.mutateAsync(values))) {
      await navigate({ to: ONBOARDING_PATHS[3] });
    }
  });

  const { errors, isSubmitting } = form.formState;
  return (
    <form className="flex flex-1 flex-col" onSubmit={submit} noValidate>
      <OnboardingBody width="narrow">
        <OnboardingHeading step={2} title={text.title} subtitle={text.subtitle} />
        <CompanySearch onSelect={fillFromDirectory} onManualEntry={focusName} />
        <div className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2">
            <AuthField id="name" label={text.nameLabel} error={errors.name?.message}>
              <Input
                id="name"
                autoComplete="organization"
                className={AUTH_FIELD_CLASS}
                aria-invalid={errors.name !== undefined}
                aria-describedby={errors.name === undefined ? undefined : authFieldErrorId("name")}
                {...form.register("name")}
              />
            </AuthField>
          </div>
          <div className="col-span-2">
            <AuthField id="siret" label={text.siretLabel} error={errors.siret?.message}>
              <Input
                id="siret"
                inputMode="numeric"
                className={`${AUTH_FIELD_CLASS} tabular-nums`}
                aria-invalid={errors.siret !== undefined}
                aria-describedby={
                  errors.siret === undefined ? undefined : authFieldErrorId("siret")
                }
                {...form.register("siret")}
              />
            </AuthField>
          </div>
          <div className="col-span-2">
            <AuthField id="address" label={text.addressLabel} error={errors.address?.message}>
              <Input
                id="address"
                autoComplete="street-address"
                className={AUTH_FIELD_CLASS}
                {...form.register("address")}
              />
            </AuthField>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <AuthField id="phone" label={text.phoneLabel} error={errors.phone?.message}>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder={text.phonePlaceholder}
                className={AUTH_FIELD_CLASS}
                {...form.register("phone")}
              />
            </AuthField>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <AuthField id="team-size" label={text.teamSizeLabel} error={undefined}>
              <TeamSizeSelect control={form.control} />
            </AuthField>
          </div>
        </div>
      </OnboardingBody>
      <OnboardingFooter width="narrow">
        <span className="hidden text-xs text-[#64748B] lg:inline">{text.footnote}</span>
        <Button type="submit" className={ONBOARDING_PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
          {isSubmitting ? onboardingFr.layout.saving : onboardingFr.layout.continue}
        </Button>
      </OnboardingFooter>
    </form>
  );
};
