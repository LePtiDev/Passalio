import { TRADE_IDS, type TradeId } from "@passalio/trades";
import { useNavigate } from "@tanstack/react-router";
import { FileCheck } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { succeeds } from "@/lib/succeeds";
import { cn } from "@/lib/utils";
import { useUpdateOrganization } from "../../hooks/use-organization";
import type { OrganizationProfile } from "../../identity-api";
import { onboardingFr, TRADE_LABELS } from "../../onboarding-fr";
import { AUTH_ERROR_CLASS } from "../auth-styles";
import { BackButton } from "./back-button";
import { OnboardingBody, OnboardingFooter, OnboardingHeading } from "./onboarding-layout";
import { ONBOARDING_PATHS } from "./onboarding-steps";
import { ONBOARDING_PRIMARY_BUTTON_CLASS } from "./onboarding-styles";

const text = onboardingFr.trades;

type TradeOptionProps = {
  readonly trade: TradeId;
  readonly isSelected: boolean;
  readonly onToggle: (trade: TradeId) => void;
};

const TradeOption = ({ trade, isSelected, onToggle }: TradeOptionProps) => {
  const toggle = useCallback(() => onToggle(trade), [onToggle, trade]);
  return (
    <label
      className={cn(
        "grid min-h-[60px] cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 rounded-xl border bg-white p-3.5 lg:items-start lg:rounded-[10px]",
        isSelected
          ? "border-[1.5px] border-[var(--brand-navy)] lg:border lg:bg-[#F7F9FB] lg:shadow-[0_0_0_3px_rgba(15,42,68,0.06)]"
          : "border-[#E3E8EF]",
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={toggle}
        className="row-span-2 size-5 lg:mt-0.5 lg:size-4"
      />
      <span className="text-[15px] font-semibold lg:text-sm">{TRADE_LABELS[trade].label}</span>
      <span className="col-start-2 text-[13px] text-[#64748B] lg:text-xs lg:text-muted-foreground">
        {TRADE_LABELS[trade].document}
      </span>
    </label>
  );
};

export const TradesStep = ({ organization }: { readonly organization: OrganizationProfile }) => {
  const navigate = useNavigate();
  const updateOrganization = useUpdateOrganization();
  const [selected, setSelected] = useState<readonly TradeId[]>(organization.trades);
  const [isMissing, setIsMissing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = useCallback((trade: TradeId) => {
    setIsMissing(false);
    setSelected((current) =>
      current.includes(trade) ? current.filter((item) => item !== trade) : [...current, trade],
    );
  }, []);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (selected.length === 0) {
        setIsMissing(true);
        return;
      }
      const trades = TRADE_IDS.filter((trade) => selected.includes(trade));
      setIsSaving(true);
      if (await succeeds(updateOrganization.mutateAsync({ trades }))) {
        await navigate({ to: ONBOARDING_PATHS[4] });
        return;
      }
      setIsSaving(false);
    },
    [navigate, selected, updateOrganization],
  );

  return (
    <form className="flex flex-1 flex-col" onSubmit={submit} noValidate>
      <OnboardingBody width="medium">
        <OnboardingHeading step={3} title={text.title} subtitle={text.subtitle} />
        <fieldset
          className="grid gap-2 sm:grid-cols-2 sm:gap-2.5"
          aria-describedby={isMissing ? "trades-error" : undefined}
        >
          <legend className="sr-only">{text.legend}</legend>
          {TRADE_IDS.map((trade) => (
            <TradeOption
              key={trade}
              trade={trade}
              isSelected={selected.includes(trade)}
              onToggle={toggle}
            />
          ))}
        </fieldset>
        {isMissing ? (
          <p id="trades-error" role="alert" className={AUTH_ERROR_CLASS}>
            {text.required}
          </p>
        ) : null}
        <div className="hidden gap-2.5 rounded-lg border border-[#EEF2F6] bg-[#F7F9FB] p-3 text-xs leading-normal text-muted-foreground lg:flex">
          <FileCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
          <span>{text.legalNote}</span>
        </div>
      </OnboardingBody>
      <OnboardingFooter width="medium">
        <BackButton to={2} />
        <span className="flex flex-1 items-center justify-end gap-3.5 lg:flex-none">
          <span className="hidden text-xs text-[#64748B] lg:inline">
            {text.selected(selected.length)}
          </span>
          <Button type="submit" className={ONBOARDING_PRIMARY_BUTTON_CLASS} disabled={isSaving}>
            {isSaving ? onboardingFr.layout.saving : onboardingFr.layout.continue}
          </Button>
        </span>
      </OnboardingFooter>
    </form>
  );
};
