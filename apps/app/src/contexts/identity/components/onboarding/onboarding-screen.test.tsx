import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { errorReply, heldReply, installFakeApi } from "@/test-support/fake-api";
import {
  ORGANIZATION_ROUTE,
  organizationReply,
  SHORT_TRACE_ID,
  signedInRoutes,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { busyElementIn, findBusyElement, skeletonsIn } from "@/test-support/skeletons";
import { onboardingFr } from "../../onboarding-fr";
import { OnboardingScreen } from "./onboarding-screen";
import { ONBOARDING_PATHS, type OnboardingStep } from "./onboarding-steps";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const layout = onboardingFr.layout;

const STEP_TITLES: readonly (readonly [Exclude<OnboardingStep, 2>, string])[] = [
  [3, onboardingFr.trades.title],
  [4, onboardingFr.documents.title],
  [5, onboardingFr.team.title],
];

const renderStep = (step: OnboardingStep, hasOrganization = true) =>
  renderScreen(<OnboardingScreen step={step} hasOrganization={hasOrganization} />, {
    path: ONBOARDING_PATHS[step],
  });

describe("OnboardingScreen", () => {
  it.each(STEP_TITLES)(
    "shows a skeleton of step %i while the company loads",
    async (step, title) => {
      const organization = heldReply(organizationReply());
      installFakeApi({ ...signedInRoutes("owner"), [ORGANIZATION_ROUTE]: organization.reply });

      const { container } = renderStep(step);

      const skeleton = await findBusyElement(container);
      expect(skeletonsIn(skeleton)).toHaveLength(3);
      expect(screen.queryByRole("heading", { level: 1, name: title })).toBeNull();

      organization.release();

      expect(await screen.findByRole("heading", { level: 1, name: title })).toBeVisible();
      expect(busyElementIn(container)).toBeNull();
    },
  );

  it.each(STEP_TITLES)(
    "shows the load error of step %i with the short trace id and retries",
    async (step, title) => {
      const api = installFakeApi({
        ...signedInRoutes("owner"),
        [ORGANIZATION_ROUTE]: errorReply("internal", TRACE_ID),
      });

      const { user } = renderStep(step);

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(fr.errors.messages.internal);
      expect(alert).toHaveTextContent(fr.errors.code(SHORT_TRACE_ID));
      expect(alert).not.toHaveTextContent(TRACE_ID);

      api.setRoute(ORGANIZATION_ROUTE, organizationReply());
      await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

      expect(await screen.findByRole("heading", { level: 1, name: title })).toBeVisible();
    },
  );

  it("prefills the company step once the existing company is loaded", async () => {
    const organization = heldReply(organizationReply({ name: "Ramonage Dupont" }));
    installFakeApi({ ...signedInRoutes("owner"), [ORGANIZATION_ROUTE]: organization.reply });

    const { container } = renderStep(2, true);

    await findBusyElement(container);
    organization.release();

    expect(await screen.findByLabelText(onboardingFr.company.nameLabel)).toHaveValue(
      "Ramonage Dupont",
    );
    expect(screen.getByLabelText(onboardingFr.company.siretLabel)).toHaveValue("123 456 789 00012");
  });

  it("shows an empty company form without loading anything for a new account", async () => {
    const api = installFakeApi({
      ...signedInRoutes("owner"),
      [ORGANIZATION_ROUTE]: organizationReply(),
    });

    renderStep(2, false);

    expect(await screen.findByLabelText(onboardingFr.company.nameLabel)).toHaveValue("");
    expect(api.requestsTo(ORGANIZATION_ROUTE)).toHaveLength(0);
  });

  it("tells where the user stands in the five steps", async () => {
    installFakeApi({ ...signedInRoutes("owner"), [ORGANIZATION_ROUTE]: organizationReply() });

    renderStep(4);

    expect((await screen.findAllByText(layout.stepOf(4, 5))).length).toBeGreaterThan(0);
    const current = screen
      .getAllByRole("listitem")
      .find((item) => item.getAttribute("aria-current") === "step");
    expect(current).toHaveTextContent(layout.steps[3].label);
  });
});
