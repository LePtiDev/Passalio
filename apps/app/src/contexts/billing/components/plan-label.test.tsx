import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  subscriptionDetails,
  subscriptionReply,
  SUBSCRIPTION_ROUTE,
} from "@/test-support/billing-replies";
import { errorReply, installFakeApi } from "@/test-support/fake-api";
import { signedInRoutes, TRACE_ID } from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { usePlanLabel } from "../hooks/use-plan-label";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const PlanLabel = () => <p>{usePlanLabel() ?? "inconnu"}</p>;

describe("usePlanLabel", () => {
  it.each([
    ["Essai gratuit", subscriptionReply()],
    ["Formule Solo", subscriptionReply({ subscription: subscriptionDetails() })],
    ["Formule Équipe", subscriptionReply({ subscription: subscriptionDetails({ plan: "team" }) })],
    [
      "Offre fondateur",
      subscriptionReply({ subscription: subscriptionDetails({ plan: "team", isFounder: true }) }),
    ],
  ])("names the plan %s", async (label, reply) => {
    installFakeApi({ ...signedInRoutes("owner"), [SUBSCRIPTION_ROUTE]: reply });
    renderScreen(<PlanLabel />);
    expect(await screen.findByText(label)).toBeVisible();
  });

  it("gives no label until the subscription is known", async () => {
    installFakeApi({
      ...signedInRoutes("owner"),
      [SUBSCRIPTION_ROUTE]: errorReply("internal", TRACE_ID),
    });
    renderScreen(<PlanLabel />);
    expect(await screen.findByText("inconnu")).toBeVisible();
  });
});
