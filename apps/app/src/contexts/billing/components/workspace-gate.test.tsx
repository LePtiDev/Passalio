import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHECKOUT_ROUTE,
  inDays,
  PORTAL_ROUTE,
  redirectReply,
  SEATS_ROUTE,
  seatsReply,
  subscriptionDetails,
  subscriptionReply,
  SUBSCRIPTION_ROUTE,
} from "@/test-support/billing-replies";
import { installFakeApi, type FakeRoutes } from "@/test-support/fake-api";
import {
  forgetToasts,
  ORGANIZATION_ROUTE,
  organizationReply,
  signedInRoutes,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { billingFr } from "../billing-fr";
import { BillingBanner } from "./billing-banner";
import { WorkspaceGate } from "./workspace-gate";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const EMAIL = "jean@ramonage-dupont.fr";

const installBilling = (routes: FakeRoutes = {}) =>
  installFakeApi({
    ...signedInRoutes("owner"),
    [ORGANIZATION_ROUTE]: organizationReply(),
    [SUBSCRIPTION_ROUTE]: subscriptionReply(),
    [SEATS_ROUTE]: seatsReply(),
    ...routes,
  });

const renderGate = (path = "/") =>
  renderScreen(
    <WorkspaceGate email={EMAIL}>
      <BillingBanner />
      <p>Contenu de l'espace</p>
    </WorkspaceGate>,
    { path },
  );

const blocked = (changes = {}) =>
  subscriptionReply({
    workspaceState: "blocked",
    blockedReason: "trial_ended",
    trialEndsAt: inDays(-1),
    ...changes,
  });

afterEach(() => {
  forgetToasts();
  vi.restoreAllMocks();
});

describe("billing banner", () => {
  it("warns the owner 3 days before the end of the trial and leads to the plans", async () => {
    installBilling();
    const { user, router } = renderGate();

    expect(await screen.findByText(billingFr.banner.trialEnding(3))).toBeVisible();
    await user.click(screen.getByRole("link", { name: billingFr.banner.trialAction }));

    expect(router.state.location.pathname).toBe("/reglages/abonnement");
  });

  it("stays quiet earlier in the trial", async () => {
    const api = installBilling({
      [SUBSCRIPTION_ROUTE]: subscriptionReply({ trialEndsAt: inDays(5) }),
    });
    renderGate();

    await waitFor(() => expect(api.requestsTo(SUBSCRIPTION_ROUTE)).toHaveLength(1));
    expect(await screen.findByText("Contenu de l'espace")).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("warns the owner of a refused payment and opens the Stripe portal", async () => {
    installBilling({
      [SUBSCRIPTION_ROUTE]: subscriptionReply({
        workspaceState: "payment_failed",
        graceEndsAt: "2026-12-09T10:00:00.000Z",
        subscription: subscriptionDetails(),
      }),
      [PORTAL_ROUTE]: redirectReply("https://billing.stripe.com/p/session/2"),
    });
    const assign = vi.spyOn(window.location, "assign").mockReturnValue();
    const { user } = renderGate();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(billingFr.banner.paymentFailed);
    expect(alert).toHaveTextContent(/9 déc\./);
    await user.click(screen.getByRole("button", { name: billingFr.banner.paymentAction }));

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith("https://billing.stripe.com/p/session/2"),
    );
  });

  it("is not repeated on the subscription page, which already explains it", async () => {
    const api = installBilling();
    renderGate("/reglages/abonnement");

    await waitFor(() => expect(api.requestsTo(SUBSCRIPTION_ROUTE)).toHaveLength(1));
    expect(await screen.findByText("Contenu de l'espace")).toBeVisible();
    expect(screen.queryByText(billingFr.banner.trialEnding(3))).toBeNull();
  });

  it("shows nothing to a member, who cannot pay", async () => {
    const api = installBilling({ [SUBSCRIPTION_ROUTE]: subscriptionReply({ canManage: false }) });
    renderGate();

    await waitFor(() => expect(api.requestsTo(SUBSCRIPTION_ROUTE)).toHaveLength(1));
    expect(await screen.findByText("Contenu de l'espace")).toBeVisible();
    expect(screen.queryByText(billingFr.banner.trialEnding(3))).toBeNull();
  });
});

describe("blocked workspace", () => {
  it("replaces the space with the plans once the trial has ended", async () => {
    const api = installBilling({
      [SUBSCRIPTION_ROUTE]: blocked(),
      [CHECKOUT_ROUTE]: redirectReply("https://checkout.stripe.com/c/pay/cs_2"),
    });
    const assign = vi.spyOn(window.location, "assign").mockReturnValue();
    const { user } = renderGate();

    expect(
      await screen.findByRole("heading", { name: billingFr.blocked.titles.trial_ended }),
    ).toBeVisible();
    expect(screen.queryByText("Contenu de l'espace")).toBeNull();
    expect(screen.getByText(EMAIL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Se déconnecter/ })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: billingFr.plans.choose("solo") }));

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_2"),
    );
    expect(api.requestsTo(CHECKOUT_ROUTE)[0]?.body).toEqual({ plan: "solo", interval: "month" });
  });

  it("asks the owner of an unpaid space to update the payment, not to subscribe again", async () => {
    installBilling({
      [SUBSCRIPTION_ROUTE]: blocked({
        blockedReason: "unpaid",
        subscription: subscriptionDetails(),
      }),
    });
    renderGate();

    expect(
      await screen.findByRole("heading", { name: billingFr.blocked.titles.unpaid }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: billingFr.alerts.payment_failed.action }),
    ).toBeEnabled();
    expect(screen.queryByRole("button", { name: billingFr.plans.choose("solo") })).toBeNull();
  });

  it("tells a member to ask the owner, without plans", async () => {
    installBilling({ [SUBSCRIPTION_ROUTE]: blocked({ canManage: false }) });
    renderGate();

    expect(
      await screen.findByRole("heading", {
        name: billingFr.blocked.memberTitle("Ramonage Dupont"),
      }),
    ).toBeVisible();
    expect(await screen.findByText(billingFr.blocked.memberText("Jean Dupont"))).toBeVisible();
    expect(screen.queryByRole("button", { name: billingFr.plans.choose("solo") })).toBeNull();
  });

  it("never blocks while online payment is not open", async () => {
    const api = installBilling({ [SUBSCRIPTION_ROUTE]: blocked({ isBillingEnabled: false }) });
    renderGate();

    await waitFor(() => expect(api.requestsTo(SUBSCRIPTION_ROUTE)).toHaveLength(1));
    expect(await screen.findByText("Contenu de l'espace")).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: billingFr.blocked.titles.trial_ended }),
    ).toBeNull();
  });

  it("keeps the space open when the subscription cannot be read, for example offline", async () => {
    const api = installBilling({ [SUBSCRIPTION_ROUTE]: { status: 503, body: null } });
    renderGate();

    await waitFor(() => expect(api.requestsTo(SUBSCRIPTION_ROUTE)).toHaveLength(1));
    expect(await screen.findByText("Contenu de l'espace")).toBeVisible();
  });
});
