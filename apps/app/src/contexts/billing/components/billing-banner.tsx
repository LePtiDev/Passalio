import { Link, useLocation } from "@tanstack/react-router";
import { Clock, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { billingFr } from "../billing-fr";
import { useBillingPortal } from "../hooks/use-stripe-redirect";
import { useSubscription } from "../hooks/use-subscription";
import { billingBannerOf, type BillingBanner as Banner } from "../subscription-view";

const text = billingFr.banner;

const SUBSCRIPTION_PATH = "/reglages/abonnement";

const PaymentAction = () => {
  const portal = useBillingPortal();
  return (
    <Button
      type="button"
      disabled={portal.isOpening}
      onClick={portal.open}
      className="w-full lg:w-auto"
    >
      {text.paymentAction}
    </Button>
  );
};

const BannerContent = ({ banner }: { readonly banner: Banner }) => {
  const isTrial = banner.kind === "trial_ending";
  const Icon = isTrial ? Clock : TriangleAlert;
  return (
    <div
      role={isTrial ? "status" : "alert"}
      className={cn(
        "flex shrink-0 flex-col gap-2 px-4 py-3 text-[14px] leading-[1.45] lg:min-h-11 lg:leading-[normal] lg:flex-row lg:items-center lg:gap-2.5 lg:px-6 lg:py-1.5 lg:text-[13px]",
        isTrial ? "bg-[#EAF1FB] text-[#1D4F91]" : "bg-[#FEF3E2] text-[#7A3B05]",
      )}
    >
      <Icon aria-hidden="true" className="hidden size-4 shrink-0 lg:block" strokeWidth={1.8} />
      {banner.kind === "trial_ending" ? (
        <span className="flex-1">
          <strong>{text.trialEnding(banner.daysLeft)}</strong> {text.trialText}
        </span>
      ) : (
        <span className="flex-1">
          <strong>{text.paymentFailed}</strong>{" "}
          <span className="lg:hidden">
            {text.paymentFailedShortText(formatShortDate(banner.graceEndsAt))}
          </span>
          <span className="hidden lg:inline">
            {text.paymentFailedText(formatShortDate(banner.graceEndsAt))}
          </span>
        </span>
      )}
      {isTrial ? (
        <Button asChild className="w-full lg:w-auto">
          <Link to={SUBSCRIPTION_PATH}>{text.trialAction}</Link>
        </Button>
      ) : (
        <PaymentAction />
      )}
    </div>
  );
};

export const BillingBanner = () => {
  const [now] = useState(() => new Date());
  const { pathname } = useLocation();
  const { data } = useSubscription();
  const banner =
    data === undefined || pathname === SUBSCRIPTION_PATH ? null : billingBannerOf(data, now);
  return banner === null ? null : <BannerContent banner={banner} />;
};
