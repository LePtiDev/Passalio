import type { BlockedReason, SubscriptionResponse } from "@passalio/shared";
import { Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignOutButton } from "@/lib/use-sign-out-button";
import { fr } from "@/fr";
import { billingFr } from "../billing-fr";
import { useBillingSeats } from "../hooks/use-billing-details";
import { usePlanCheckout } from "../hooks/use-plan-checkout";
import { useBillingPortal } from "../hooks/use-stripe-redirect";
import { recommendedPlanOf } from "../subscription-view";
import { PlanChoice } from "./plan-choice";

const text = billingFr.blocked;

const OwnerPlanChoice = ({ technicianCount }: { readonly technicianCount: number | null }) => {
  const checkout = usePlanCheckout();
  return (
    <>
      <PlanChoice
        interval={checkout.interval}
        onIntervalChange={checkout.changeInterval}
        recommendedPlan={recommendedPlanOf(technicianCount ?? 1)}
        technicianCount={null}
        isDisabled={false}
        openingPlan={checkout.openingPlan}
        isCompact
        onChoose={checkout.choose}
      />
      <p className="text-[13px] text-[#64748B] lg:text-center">{billingFr.paymentNoteShort}</p>
    </>
  );
};

const UpdatePaymentAction = () => {
  const portal = useBillingPortal();
  return (
    <Button
      type="button"
      disabled={portal.isOpening}
      onClick={portal.open}
      className="w-full lg:mx-auto lg:w-auto"
    >
      {billingFr.alerts.payment_failed.action}
    </Button>
  );
};

const ownerTextOf = (reason: BlockedReason | null) =>
  reason === "unpaid" ? text.unpaidText : text.ownerText;

type BlockedWorkspaceScreenProps = {
  readonly subscription: SubscriptionResponse;
  readonly email: string;
  readonly organizationName: string | null;
};

export const BlockedWorkspaceScreen = ({
  subscription,
  email,
  organizationName,
}: BlockedWorkspaceScreenProps) => {
  const { signOut, isSigningOut } = useSignOutButton();
  const seats = useBillingSeats();
  const { canManage, blockedReason } = subscription;
  return (
    <div className="flex min-h-dvh flex-col bg-[#F7F9FB] leading-[normal] text-[#0F2A44]">
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-[#E3E8EF] bg-white py-1 pr-1 pl-4 lg:px-6">
        <span className="flex flex-1 items-center gap-2 text-[17px] font-bold lg:flex-none lg:text-[18px]">
          <span aria-hidden="true" className="size-5 rounded-[5px] bg-[#0F2A44] lg:size-[22px]" />
          {fr.app.name}
        </span>
        {organizationName === null ? null : (
          <span className="hidden text-[14px] text-[#64748B] lg:inline">{organizationName}</span>
        )}
        <span className="flex items-center gap-4 lg:ml-auto">
          <span className="hidden text-[13px] text-[#475569] lg:inline">{email}</span>
          <Button
            type="button"
            variant="secondary"
            onClick={signOut}
            disabled={isSigningOut}
            aria-label={fr.app.signOut}
            className="border-0 lg:border"
          >
            <LogOut aria-hidden="true" />
            <span className="hidden lg:inline">{fr.app.signOut}</span>
          </Button>
        </span>
      </header>
      <main className="flex flex-1 justify-center px-4 py-5 lg:py-12">
        <div className="flex w-full max-w-[720px] flex-col gap-3.5 lg:gap-6">
          <div className="flex flex-col gap-2.5 lg:items-center lg:text-center">
            <span
              aria-hidden="true"
              className="hidden size-12 items-center justify-center rounded-xl border border-[#E3E8EF] bg-white lg:flex"
            >
              <Lock className="size-5" strokeWidth={1.8} />
            </span>
            <h1 className="text-[22px] leading-[1.25] font-bold lg:leading-[normal] lg:text-[24px] lg:tracking-[-0.015em]">
              {canManage
                ? text.titles[blockedReason ?? "trial_ended"]
                : text.memberTitle(organizationName)}
            </h1>
            <p className="max-w-[560px] text-[15px] leading-normal text-[#475569] lg:text-[14px]">
              {canManage
                ? ownerTextOf(blockedReason)
                : text.memberText(seats.data?.ownerName ?? null)}
            </p>
          </div>
          {canManage && blockedReason === "unpaid" ? <UpdatePaymentAction /> : null}
          {canManage && blockedReason !== "unpaid" ? (
            <OwnerPlanChoice technicianCount={seats.data?.technicianCount ?? null} />
          ) : null}
          <section
            aria-labelledby="data-title"
            className="flex flex-col gap-0.5 rounded-xl border border-[#E3E8EF] bg-white p-4"
          >
            <h2 id="data-title" className="text-[14px] font-bold">
              {text.dataTitle}
            </h2>
            <p className="text-[13px] leading-normal text-[#475569]">{text.dataText}</p>
          </section>
        </div>
      </main>
    </div>
  );
};
