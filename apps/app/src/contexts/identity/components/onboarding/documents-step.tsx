import { zodResolver } from "@hookform/resolvers/zod";
import {
  DOCUMENT_NUMBER_PREFIX_PATTERN,
  MAX_FIRST_DOCUMENT_NUMBER,
  type BrandColor,
} from "@passalio/shared";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { succeeds } from "@/lib/succeeds";
import { ORGANIZATION_LOGO_URL, useUpdateOrganization } from "../../hooks/use-organization";
import type { OrganizationProfile } from "../../identity-api";
import { onboardingFr, TRADE_LABELS } from "../../onboarding-fr";
import { AuthField, authFieldErrorId } from "../auth-field";
import { AUTH_FIELD_CLASS } from "../auth-styles";
import { BackButton } from "./back-button";
import { BrandColorPicker } from "./brand-color-picker";
import { DocumentPreview } from "./document-preview";
import { LogoPicker } from "./logo-picker";
import { OnboardingBody, OnboardingFooter, OnboardingHeading } from "./onboarding-layout";
import { ONBOARDING_PATHS } from "./onboarding-steps";

const text = onboardingFr.documents;

const numberingSchema = z.object({
  prefix: z.string().regex(DOCUMENT_NUMBER_PREFIX_PATTERN, { error: text.numberingInvalid }),
  firstNumber: z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, { error: text.firstNumberInvalid })
    .refine(
      (value) => {
        const number = Number(value);
        return number >= 1 && number <= MAX_FIRST_DOCUMENT_NUMBER;
      },
      { error: text.firstNumberInvalid },
    ),
});

type NumberingValues = z.infer<typeof numberingSchema>;

const NUMBER_WIDTH = 4;

const defaultPrefix = () => `${new Date().getFullYear()}-`;

const useLogoUrl = (hasLogo: boolean) => {
  const [logoUrl, setLogoUrl] = useState(hasLogo ? ORGANIZATION_LOGO_URL : null);
  const refresh = useCallback(() => setLogoUrl(`${ORGANIZATION_LOGO_URL}?v=${Date.now()}`), []);
  return { logoUrl, refresh };
};

export const DocumentsStep = ({ organization }: { readonly organization: OrganizationProfile }) => {
  const navigate = useNavigate();
  const updateOrganization = useUpdateOrganization();
  const [brandColor, setBrandColor] = useState<BrandColor>(organization.brandColor);
  const { logoUrl, refresh } = useLogoUrl(organization.hasLogo);
  const form = useForm<NumberingValues>({
    resolver: zodResolver(numberingSchema),
    defaultValues: {
      prefix:
        organization.documentNumberPrefix === ""
          ? defaultPrefix()
          : organization.documentNumberPrefix,
      firstNumber: String(organization.nextDocumentNumber).padStart(NUMBER_WIDTH, "0"),
    },
  });
  const [prefix, firstNumber] = useWatch({
    control: form.control,
    name: ["prefix", "firstNumber"],
  });

  const submit = form.handleSubmit(async (values) => {
    const changes = {
      brandColor,
      documentNumberPrefix: values.prefix,
      nextDocumentNumber: Number(values.firstNumber),
    };
    if (await succeeds(updateOrganization.mutateAsync(changes))) {
      await navigate({ to: ONBOARDING_PATHS[5] });
    }
  });

  const firstTrade = organization.trades[0] ?? "chimney_sweeping";
  const { errors, isSubmitting } = form.formState;
  return (
    <form className="flex flex-1 flex-col" onSubmit={submit} noValidate>
      <OnboardingBody width="wide">
        <div className="flex flex-wrap items-start gap-10">
          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5 lg:gap-[22px]">
            <OnboardingHeading step={4} title={text.title} subtitle={text.subtitle} />
            <LogoPicker
              name={organization.name}
              brandColor={brandColor}
              logoUrl={logoUrl}
              onUploaded={refresh}
            />
            <BrandColorPicker value={brandColor} onChange={setBrandColor} />
            <div className="grid grid-cols-2 gap-3.5">
              <AuthField id="prefix" label={text.prefixLabel} error={errors.prefix?.message}>
                <Input
                  id="prefix"
                  className={AUTH_FIELD_CLASS}
                  aria-invalid={errors.prefix !== undefined}
                  aria-describedby={
                    errors.prefix === undefined ? "numbering-hint" : authFieldErrorId("prefix")
                  }
                  {...form.register("prefix")}
                />
              </AuthField>
              <AuthField
                id="firstNumber"
                label={text.firstNumberLabel}
                error={errors.firstNumber?.message}
              >
                <Input
                  id="firstNumber"
                  inputMode="numeric"
                  className={`${AUTH_FIELD_CLASS} tabular-nums`}
                  aria-invalid={errors.firstNumber !== undefined}
                  aria-describedby={
                    errors.firstNumber === undefined
                      ? "numbering-hint"
                      : authFieldErrorId("firstNumber")
                  }
                  {...form.register("firstNumber")}
                />
              </AuthField>
              <span
                id="numbering-hint"
                className="col-span-2 text-[13px] text-[#64748B] lg:text-xs"
              >
                {text.numberingHint}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-[1_1_380px]">
            <DocumentPreview
              name={organization.name}
              address={organization.address}
              siret={organization.siret}
              documentTitle={TRADE_LABELS[firstTrade].document}
              documentNumber={`${prefix}${firstNumber}`}
              brandColor={brandColor}
              logoUrl={logoUrl}
            />
          </div>
        </div>
      </OnboardingBody>
      <OnboardingFooter width="wide">
        <BackButton to={3} />
        <span className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
          <Button asChild variant="secondary">
            <Link to={ONBOARDING_PATHS[5]}>{onboardingFr.layout.skip}</Link>
          </Button>
          <Button type="submit" className="flex-1 lg:flex-none" disabled={isSubmitting}>
            {isSubmitting ? onboardingFr.layout.saving : onboardingFr.layout.continue}
          </Button>
        </span>
      </OnboardingFooter>
    </form>
  );
};
