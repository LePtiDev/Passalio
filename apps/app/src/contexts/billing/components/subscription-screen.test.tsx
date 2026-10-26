import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  anInvoice,
  CHECKOUT_ROUTE,
  INVOICES_ROUTE,
  invoicesReply,
  PORTAL_ROUTE,
  redirectReply,
  SEATS_ROUTE,
  seatsReply,
  subscriptionDetails,
  subscriptionReply,
  SUBSCRIPTION_ROUTE,
} from "@/test-support/billing-replies";
import { errorReply, heldReply, installFakeApi, type FakeRoutes } from "@/test-support/fake-api";
import {
  forgetToasts,
  ORGANIZATION_ROUTE,
  organizationReply,
  signedInRoutes,
  SHORT_TRACE_ID,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { skeletonsIn } from "@/test-support/skeletons";
import { billingFr } from "../billing-fr";
import { SubscriptionScreen } from "./subscription-screen";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = billingFr;

const installBilling = (routes: FakeRoutes = {}) =>
  installFakeApi({
    ...signedInRoutes("owner"),
    [SUBSCRIPTION_ROUTE]: subscriptionReply(),
    [SEATS_ROUTE]: seatsReply(),
    [INVOICES_ROUTE]: invoicesReply(),
    ...routes,
  });

const renderSubscription = ({
  isReturningFromCheckout = false,
  onCheckoutConfirmed = vi.fn<() => void>(),
} = {}) =>
  renderScreen(
    <SubscriptionScreen
      isReturningFromCheckout={isReturningFromCheckout}
      onCheckoutConfirmed={onCheckoutConfirmed}
    />,
    { path: "/reglages/abonnement" },
  );

const stubStripePage = () => vi.spyOn(window.location, "assign").mockReturnValue();

afterEach(() => {
  forgetToasts();
  vi.restoreAllMocks();
});

describe("SubscriptionScreen during the trial", () => {
  it("shows the days left and recommends Solo to a company with one technician", async () => {
    installBilling();
    renderSubscription();

    expect(await screen.findByText(text.trial.daysLeft(3))).toBeVisible();
    expect(screen.getByRole("progressbar", { name: text.trial.progressLabel })).toHaveAttribute(
      "value",
      "4",
    );
    const solo = screen.getByRole("region", { name: /^Solo/ });
    expect(within(solo).getByText(text.plans.recommendedFor(1))).toBeInTheDocument();
    expect(within(solo).getByRole("button", { name: text.plans.choose("solo") })).toBeEnabled();
  });

  it("recommends Équipe once the company has two technicians", async () => {
    installBilling({ [SEATS_ROUTE]: seatsReply(2) });
    renderSubscription();

    const team = await screen.findByRole("region", { name: /^Équipe/ });
    expect(await within(team).findByText(text.plans.recommendedFor(2))).toBeInTheDocument();
  });

  it("shows the yearly prices when the owner picks yearly payment", async () => {
    installBilling();
    const { user } = renderSubscription();

    await user.click(await screen.findByRole("radio", { name: text.interval.year }));

    const solo = screen.getByRole("region", { name: /^Solo/ });
    expect(within(solo).getAllByText(text.plans.price(290)).length).toBeGreaterThan(0);
    expect(within(solo).getByText(text.plans.perYear)).toBeInTheDocument();
  });

  it("sends the owner to Stripe Checkout with the chosen plan and period", async () => {
    const api = installBilling({
      [CHECKOUT_ROUTE]: redirectReply("https://checkout.stripe.com/c/pay/cs_1"),
    });
    const openStripePage = stubStripePage();
    const { user } = renderSubscription();

    await user.click(await screen.findByRole("radio", { name: text.interval.year }));
    await user.click(screen.getByRole("button", { name: text.plans.choose("team") }));

    await waitFor(() =>
      expect(openStripePage).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_1"),
    );
    expect(api.requestsTo(CHECKOUT_ROUTE)[0]?.body).toEqual({ plan: "team", interval: "year" });
    expect(screen.getByRole("button", { name: text.plans.opening })).toBeDisabled();
  });

  it("explains a Checkout failure with the short trace code", async () => {
    installBilling({ [CHECKOUT_ROUTE]: errorReply("internal", TRACE_ID) });
    const openStripePage = stubStripePage();
    const { user } = renderSubscription();

    await user.click(await screen.findByRole("button", { name: text.plans.choose("solo") }));

    expect(await screen.findByText(text.subscribed.stripeFailed)).toBeVisible();
    expect(screen.getByText(new RegExp(SHORT_TRACE_ID))).toBeVisible();
    expect(openStripePage).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: text.plans.choose("solo") })).toBeEnabled();
  });

  it("lets a member see the trial without choosing a plan", async () => {
    installBilling({ [SUBSCRIPTION_ROUTE]: subscriptionReply({ canManage: false }) });
    renderSubscription();

    expect(await screen.findByText(text.alerts.member.title("Jean Dupont"))).toBeVisible();
    expect(screen.getByRole("button", { name: text.plans.choose("solo") })).toBeDisabled();
    expect(screen.getByRole("button", { name: text.plans.choose("team") })).toBeDisabled();
  });

  it("says that online payment is coming while Stripe is not set up", async () => {
    installBilling({ [SUBSCRIPTION_ROUTE]: subscriptionReply({ isBillingEnabled: false }) });
    renderSubscription();

    expect(await screen.findByText(text.billingDisabled.title)).toBeVisible();
    expect(screen.queryByText(text.trial.title)).toBeNull();
    expect(screen.getByRole("button", { name: text.plans.choose("solo") })).toBeDisabled();
  });
});

const subscribed = (changes = {}) =>
  subscriptionReply({
    workspaceState: "active",
    subscription: subscriptionDetails(),
    ...changes,
  });

describe("SubscriptionScreen of a subscribed company", () => {
  it("shows the plan, the next payment, the card, the technicians and the invoices", async () => {
    installBilling({ [SUBSCRIPTION_ROUTE]: subscribed() });
    renderSubscription();

    expect(
      await screen.findByRole("heading", { name: text.subscribed.title("solo", false, false) }),
    ).toBeInTheDocument();
    expect(screen.getByText(text.subscribed.badges.active)).toBeInTheDocument();
    expect(screen.getByText(text.subscribed.card("4242"))).toBeInTheDocument();
    expect(screen.getByText(text.subscribed.soloTechnicians(1))).toBeInTheDocument();
    expect(screen.getByText(/24 nov\. 2026, 29,00/)).toBeInTheDocument();
    expect(await screen.findByText("PASSALIO-0001")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: text.invoices.downloadLabel("PASSALIO-0001") }),
    ).toHaveAttribute("href", "https://pay.stripe.com/invoice/in_1/pdf");
  });

  it("shortens the plan name on the phone and keeps the full name for screen readers", async () => {
    installBilling({ [SUBSCRIPTION_ROUTE]: subscribed() });
    renderSubscription();

    expect(
      await screen.findByRole("heading", { name: text.subscribed.title("solo", false, false) }),
    ).toBeInTheDocument();
    expect(screen.getByText(text.subscribed.shortTitle("solo", false, false))).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("opens the Stripe portal to change the plan", async () => {
    installBilling({
      [SUBSCRIPTION_ROUTE]: subscribed(),
      [PORTAL_ROUTE]: redirectReply("https://billing.stripe.com/p/session/1"),
    });
    const openStripePage = stubStripePage();
    const { user } = renderSubscription();

    await user.click(
      (await screen.findAllByRole("button", { name: text.subscribed.changePlan }))[0]!,
    );

    await waitFor(() =>
      expect(openStripePage).toHaveBeenCalledWith("https://billing.stripe.com/p/session/1"),
    );
  });

  it("explains a portal failure with the short trace code", async () => {
    installBilling({
      [SUBSCRIPTION_ROUTE]: subscribed(),
      [PORTAL_ROUTE]: errorReply("internal", TRACE_ID),
    });
    stubStripePage();
    const { user } = renderSubscription();

    await user.click(await screen.findByRole("button", { name: text.subscribed.cancel }));

    expect(await screen.findByText(text.subscribed.stripeFailed)).toBeVisible();
    expect(screen.getByText(new RegExp(SHORT_TRACE_ID))).toBeVisible();
  });

  it("tells the owner that a SEPA debit is being confirmed", async () => {
    installBilling({
      [SUBSCRIPTION_ROUTE]: subscribed({
        workspaceState: "payment_pending",
        subscription: subscriptionDetails({ paymentMethod: { type: "sepa_debit", last4: "3201" } }),
      }),
      [INVOICES_ROUTE]: invoicesReply([anInvoice({ status: "open" })]),
    });
    renderSubscription();

    expect(await screen.findByText(text.alerts.payment_pending.title)).toBeVisible();
    expect(screen.getByText(text.subscribed.sepa("3201"))).toBeInTheDocument();
    expect(await screen.findByText(text.invoices.states.processing)).toBeInTheDocument();
  });

  it("asks the owner to update a refused payment before the end of access", async () => {
    installBilling({
      [SUBSCRIPTION_ROUTE]: subscribed({
        workspaceState: "payment_failed",
        graceEndsAt: "2026-12-09T10:00:00.000Z",
      }),
      [INVOICES_ROUTE]: invoicesReply([anInvoice({ status: "open" })]),
    });
    renderSubscription();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Le paiement de 29,00.* du 24 nov\. a été refusé\./);
    expect(alert).toHaveTextContent(/avant le 9 déc\./);
    expect(
      within(alert).getByRole("button", { name: text.alerts.payment_failed.action }),
    ).toBeEnabled();
    expect(screen.getByText(text.subscribed.badges.payment_failed)).toBeInTheDocument();
    expect(await screen.findByText(text.invoices.states.unpaid)).toBeInTheDocument();
  });

  it("tells the owner when a canceled subscription stops and offers to resume it", async () => {
    installBilling({
      [SUBSCRIPTION_ROUTE]: subscribed({
        subscription: subscriptionDetails({
          currentPeriodEndsAt: "2026-12-24T10:00:00.000Z",
          isCancelScheduled: true,
        }),
      }),
    });
    renderSubscription();

    expect(
      await screen.findByText(text.alerts.cancel_scheduled.title("24 déc. 2026")),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: text.alerts.cancel_scheduled.action })).toBeEnabled();
    expect(screen.queryByRole("button", { name: text.subscribed.cancel })).toBeNull();
  });

  it("shows a member the plan without payment details, actions nor invoices", async () => {
    const api = installBilling({
      [SUBSCRIPTION_ROUTE]: subscribed({
        canManage: false,
        subscription: subscriptionDetails({ paymentMethod: null }),
      }),
    });
    renderSubscription();

    expect(await screen.findByText(text.alerts.member.title("Jean Dupont"))).toBeVisible();
    expect(screen.queryByText(text.subscribed.paymentMethod)).toBeNull();
    expect(screen.queryByRole("button", { name: text.subscribed.changePlan })).toBeNull();
    expect(screen.queryByRole("region", { name: text.invoices.title })).toBeNull();
    expect(api.requestsTo(INVOICES_ROUTE)).toHaveLength(0);
  });

  it("invites to wait for the first invoice when there is none yet", async () => {
    installBilling({ [SUBSCRIPTION_ROUTE]: subscribed(), [INVOICES_ROUTE]: invoicesReply([]) });
    renderSubscription();

    expect(await screen.findByText(text.invoices.empty)).toBeInTheDocument();
  });

  it("says when the invoices cannot be loaded", async () => {
    installBilling({
      [SUBSCRIPTION_ROUTE]: subscribed(),
      [INVOICES_ROUTE]: errorReply("internal", TRACE_ID),
    });
    renderSubscription();

    expect(await screen.findByText(text.invoices.loadFailed)).toBeInTheDocument();
  });

  it("welcomes the owner back from Checkout once Stripe confirms the plan", async () => {
    let isConfirmed = false;
    installBilling({
      [SUBSCRIPTION_ROUTE]: () =>
        isConfirmed ? subscribed() : subscriptionReply({ workspaceState: "trial" }),
    });
    const onCheckoutConfirmed = vi.fn<() => void>();
    renderSubscription({ isReturningFromCheckout: true, onCheckoutConfirmed });

    expect(await screen.findByText(text.trial.title)).toBeVisible();
    isConfirmed = true;

    expect(
      await screen.findByText(text.subscribed.welcome("solo"), {}, { timeout: 5000 }),
    ).toBeVisible();
    expect(onCheckoutConfirmed).toHaveBeenCalledTimes(1);
  });
});

describe("SubscriptionScreen loading and errors", () => {
  it("names the company under the title on the phone", async () => {
    installBilling({ [ORGANIZATION_ROUTE]: organizationReply({ name: "Ramonage Martin" }) });
    renderSubscription();

    expect(await screen.findByText("Ramonage Martin")).toBeInTheDocument();
  });

  it("shows a skeleton shaped like the trial while loading", async () => {
    const held = heldReply(subscriptionReply());
    installBilling({ [SUBSCRIPTION_ROUTE]: held.reply });
    renderSubscription();

    const busy = await screen.findByLabelText(text.loading);
    expect(skeletonsIn(busy).length).toBeGreaterThanOrEqual(5);
    held.release();
    expect(await screen.findByText(text.trial.title)).toBeVisible();
  });

  it("shows the error with its short trace code and retries", async () => {
    const api = installBilling({ [SUBSCRIPTION_ROUTE]: errorReply("internal", TRACE_ID) });
    const { user } = renderSubscription();

    expect(await screen.findByText(text.loadFailed)).toBeVisible();
    expect(screen.getByText(new RegExp(SHORT_TRACE_ID))).toBeVisible();
    api.setRoute(SUBSCRIPTION_ROUTE, subscriptionReply());
    await user.click(screen.getByRole("button", { name: /Réessayer/ }));

    expect(await screen.findByText(text.trial.title)).toBeVisible();
  });
});
