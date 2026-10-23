import { LOGO_MAX_BYTES } from "@passalio/shared";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { errorReply, heldReply, installFakeApi, type FakeRoutes } from "@/test-support/fake-api";
import {
  forgetToasts,
  noContentReply,
  organizationProfile,
  ORGANIZATION_ROUTE,
  organizationReply,
  SHORT_TRACE_ID,
  signedInRoutes,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import type { OrganizationProfile } from "../../identity-api";
import { BRAND_COLOR_LABELS, onboardingFr } from "../../onboarding-fr";
import { DocumentsStep } from "./documents-step";

const text = onboardingFr.documents;

const UPDATE_ROUTE = "PATCH /api/organization";
const LOGO_ROUTE = "PUT /api/organization/logo";

const installDocuments = (routes: FakeRoutes = {}) =>
  installFakeApi({
    ...signedInRoutes("owner"),
    [UPDATE_ROUTE]: noContentReply(),
    [LOGO_ROUTE]: noContentReply(),
    [ORGANIZATION_ROUTE]: organizationReply(),
    ...routes,
  });

const renderDocuments = (organization: OrganizationProfile = organizationProfile()) =>
  renderScreen(<DocumentsStep organization={organization} />, {
    path: "/configuration/documents",
  });

const logoFile = (bytes: number) =>
  new File([new Uint8Array(bytes)], "logo.png", { type: "image/png" });

describe("DocumentsStep", () => {
  afterEach(forgetToasts);

  it("previews the first document number from the numbering fields", async () => {
    installDocuments();
    const { user } = renderDocuments(
      organizationProfile({ documentNumberPrefix: "RD-", nextDocumentNumber: 42 }),
    );

    expect(await screen.findByLabelText(text.prefixLabel)).toHaveValue("RD-");
    expect(screen.getByLabelText(text.firstNumberLabel)).toHaveValue("0042");
    expect(screen.getByText(text.previewNumber("RD-0042"))).toBeInTheDocument();

    await user.clear(screen.getByLabelText(text.firstNumberLabel));
    await user.type(screen.getByLabelText(text.firstNumberLabel), "150");

    expect(screen.getByText(text.previewNumber("RD-150"))).toBeInTheDocument();
  });

  it("shows the French validation messages for the numbering", async () => {
    const api = installDocuments();
    const { user } = renderDocuments();

    const prefix = await screen.findByLabelText(text.prefixLabel);
    await user.clear(prefix);
    await user.type(prefix, "2026 !");
    await user.clear(screen.getByLabelText(text.firstNumberLabel));
    await user.type(screen.getByLabelText(text.firstNumberLabel), "0");
    await user.click(screen.getByRole("button", { name: onboardingFr.layout.continue }));

    expect(await screen.findByText(text.numberingInvalid)).toBeVisible();
    expect(screen.getByText(text.firstNumberInvalid)).toBeVisible();
    expect(api.requestsTo(UPDATE_ROUTE)).toHaveLength(0);
  });

  it("saves the color and the numbering, then opens the team step", async () => {
    const update = heldReply(noContentReply());
    const api = installDocuments({ [UPDATE_ROUTE]: update.reply });
    const { user, router } = renderDocuments();

    const green = await screen.findByRole("button", { name: BRAND_COLOR_LABELS["#0E7C5A"] });
    await user.click(green);
    expect(green).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: onboardingFr.layout.continue }));

    expect(await screen.findByRole("button", { name: onboardingFr.layout.saving })).toBeDisabled();
    update.release();

    await waitFor(() => expect(router.state.location.pathname).toBe("/configuration/equipe"));
    expect(api.requestsTo(UPDATE_ROUTE)[0]?.body).toEqual({
      brandColor: "#0E7C5A",
      documentNumberPrefix: "2026-",
      nextDocumentNumber: 1,
    });
  });

  it("shows a failed save with the short trace id and stays on the step", async () => {
    installDocuments({ [UPDATE_ROUTE]: errorReply("internal", TRACE_ID) });
    const { user, router } = renderDocuments();

    await user.click(await screen.findByRole("button", { name: onboardingFr.layout.continue }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(router.state.location.pathname).toBe("/configuration/documents");
  });

  it("lets the user skip the step", async () => {
    const api = installDocuments();
    const { user, router } = renderDocuments();

    await user.click(await screen.findByRole("link", { name: onboardingFr.layout.skip }));

    expect(router.state.location.pathname).toBe("/configuration/equipe");
    expect(api.requestsTo(UPDATE_ROUTE)).toHaveLength(0);
  });

  it("uploads the logo and offers to replace it", async () => {
    const upload = heldReply(noContentReply());
    const api = installDocuments({ [LOGO_ROUTE]: upload.reply });
    const { user } = renderDocuments();

    expect(await screen.findByText(text.logoAction)).toBeVisible();
    await user.upload(screen.getByLabelText(new RegExp(text.logoAction)), logoFile(1024));

    expect(await screen.findByText(text.logoUploading)).toBeVisible();
    upload.release();

    expect(await screen.findByText(text.logoReplace)).toBeVisible();
    expect(screen.getAllByRole("img", { name: text.logoAlt }).length).toBeGreaterThan(0);
    expect(api.requestsTo(LOGO_ROUTE)).toHaveLength(1);
  });

  it("refuses a logo over 2 MB without sending it", async () => {
    const api = installDocuments();
    const { user } = renderDocuments();

    await user.upload(
      await screen.findByLabelText(new RegExp(text.logoAction)),
      logoFile(LOGO_MAX_BYTES + 1),
    );

    expect(await screen.findByText(text.logoTooBig)).toBeVisible();
    expect(api.requestsTo(LOGO_ROUTE)).toHaveLength(0);
  });

  it("shows a failed logo upload with the short trace id", async () => {
    installDocuments({ [LOGO_ROUTE]: errorReply("internal", TRACE_ID) });
    const { user } = renderDocuments();

    await user.upload(await screen.findByLabelText(new RegExp(text.logoAction)), logoFile(1024));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.getByText(text.logoAction)).toBeVisible();
  });
});
