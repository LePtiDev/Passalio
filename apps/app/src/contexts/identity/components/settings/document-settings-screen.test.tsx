import type { OrganizationRole } from "@passalio/shared";
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderPreviewPages } from "@/lib/pdf/preview-pages";
import { errorReply, heldReply, installFakeApi, type FakeRoutes } from "@/test-support/fake-api";
import {
  forgetToasts,
  noContentReply,
  ORGANIZATION_ROUTE,
  organizationReply,
  signedInRoutes,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import {
  DOCUMENT_SETTINGS_ROUTE,
  documentSettingsReply,
  REMOVE_LOGO_ROUTE,
  UPDATE_ORGANIZATION_ROUTE,
} from "@/test-support/settings-replies";
import { BRAND_COLOR_LABELS } from "../../onboarding-fr";
import { settingsFr, TEMPLATE_TEXTS } from "../../settings-fr";
import { DocumentSettingsScreen } from "./document-settings-screen";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

vi.mock("@/lib/pdf/preview-pages", () => ({
  renderPreviewPages: vi.fn<typeof renderPreviewPages>(),
}));

const PAGES = ["data:image/png;base64,cGFnZTE=", "data:image/png;base64,cGFnZTI="];

const text = settingsFr.documents;

const labelled = (label: string) => new RegExp(`^${label}\\*?$`);

const installDocuments = (routes: FakeRoutes = {}, role: OrganizationRole = "owner") =>
  installFakeApi({
    ...signedInRoutes(role),
    [ORGANIZATION_ROUTE]: organizationReply({
      documentNumberPrefix: "RD-",
      nextDocumentNumber: 42,
    }),
    [DOCUMENT_SETTINGS_ROUTE]: documentSettingsReply(),
    [UPDATE_ORGANIZATION_ROUTE]: noContentReply(),
    [REMOVE_LOGO_ROUTE]: noContentReply(),
    ...routes,
  });

const renderDocuments = () =>
  renderScreen(<DocumentSettingsScreen />, { path: "/reglages/documents" });

const desktopPreview = async () => within(await screen.findByRole("complementary"));

describe("DocumentSettingsScreen", () => {
  beforeEach(() => {
    vi.mocked(renderPreviewPages).mockResolvedValue(PAGES);
  });

  afterEach(forgetToasts);

  it("shows the saved appearance and previews both pages of the certificate", async () => {
    installDocuments();
    const { user } = renderDocuments();

    expect(
      await screen.findByRole("radio", { name: new RegExp(TEMPLATE_TEXTS.banner.label) }),
    ).toBeChecked();
    expect(screen.getByLabelText(labelled(text.prefix))).toHaveValue("RD-");
    expect(screen.getByText(new RegExp(text.nextCertificate("RD-0042")))).toBeVisible();

    expect(
      await (await desktopPreview()).findByRole("img", { name: text.page(1) }),
    ).toHaveAttribute("src", PAGES[0]);
    await user.click((await desktopPreview()).getByRole("tab", { name: text.page(2) }));
    expect((await desktopPreview()).getByRole("img", { name: text.page(2) })).toHaveAttribute(
      "src",
      PAGES[1],
    );
    expect(vi.mocked(renderPreviewPages)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        number: "RD-0042",
        company: expect.objectContaining({ siren: "123456789" }),
      }),
    );
    expect(screen.queryByText(text.previewMissingCompanyLink)).toBeNull();
  });

  it("previews with sample legal details while the company is incomplete", async () => {
    installDocuments({ [DOCUMENT_SETTINGS_ROUTE]: documentSettingsReply({ legalForm: null }) });
    const { user, router } = renderDocuments();

    const link = await (
      await desktopPreview()
    ).findByRole("link", {
      name: text.previewMissingCompanyLink,
    });
    await user.click(link);

    expect(router.state.location.pathname).toBe("/reglages/entreprise");
  });

  it("shows a skeleton while the preview renders and an error when it fails", async () => {
    vi.mocked(renderPreviewPages).mockRejectedValue(new Error("pdf_failed"));
    installDocuments();
    renderDocuments();

    expect(await (await desktopPreview()).findByLabelText(text.previewLoading)).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(await (await desktopPreview()).findByText(text.previewFailed)).toBeVisible();
  });

  it("refreshes the preview with the unsaved changes", async () => {
    installDocuments();
    const { user } = renderDocuments();

    await user.click(
      await screen.findByRole("radio", { name: new RegExp(TEMPLATE_TEXTS.plain.label) }),
    );
    await user.type(screen.getByLabelText(labelled(text.footerText)), "Assurance AXA");

    await waitFor(() =>
      expect(vi.mocked(renderPreviewPages)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          branding: expect.objectContaining({ template: "plain", footerText: "Assurance AXA" }),
        }),
      ),
    );
  });

  it("saves only the changed settings and confirms", async () => {
    const update = heldReply(noContentReply());
    const api = installDocuments({ [UPDATE_ORGANIZATION_ROUTE]: update.reply });
    const { user } = renderDocuments();

    await user.click(
      await screen.findByRole("radio", { name: new RegExp(TEMPLATE_TEXTS.plain.label) }),
    );
    await user.click(screen.getByRole("button", { name: BRAND_COLOR_LABELS["#0E7C5A"] }));
    await user.type(screen.getByLabelText(labelled(text.email)), "contact@ramonage-dupont.fr");
    expect(screen.getAllByText(settingsFr.unsavedChanges(3)).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: settingsFr.save }));

    expect(await screen.findByRole("button", { name: settingsFr.saving })).toBeDisabled();
    update.release();

    expect(await screen.findByText(settingsFr.saved)).toBeVisible();
    expect(api.requestsTo(UPDATE_ORGANIZATION_ROUTE)[0]?.body).toEqual({
      documentTemplate: "plain",
      brandColor: "#0E7C5A",
      contactEmail: "contact@ramonage-dupont.fr",
    });
  });

  it("refuses an invalid e-mail without sending it", async () => {
    const api = installDocuments();
    const { user } = renderDocuments();

    await user.type(await screen.findByLabelText(labelled(text.email)), "contact@");
    await user.click(screen.getByRole("button", { name: settingsFr.save }));

    expect(await screen.findByText(text.errors.email)).toBeVisible();
    expect(api.requestsTo(UPDATE_ORGANIZATION_ROUTE)).toHaveLength(0);
  });

  it("asks for a larger number when the next number is already used", async () => {
    installDocuments({
      [UPDATE_ORGANIZATION_ROUTE]: errorReply("document_number_already_used", TRACE_ID, 409),
    });
    const { user } = renderDocuments();

    const next = await screen.findByLabelText(labelled(text.nextNumber));
    await user.clear(next);
    await user.type(next, "12");
    await user.click(screen.getByRole("button", { name: settingsFr.save }));

    expect(await screen.findByText(text.errors.numberAlreadyUsed)).toBeVisible();
    expect(next).toHaveAttribute("aria-invalid", "true");
  });

  it("explains that the number can only go up once numbers are reserved", async () => {
    installDocuments({
      [DOCUMENT_SETTINGS_ROUTE]: documentSettingsReply({ hasReservedNumbers: true }),
    });
    renderDocuments();

    expect(await screen.findByText(new RegExp(text.numberingLocked))).toBeVisible();
  });

  it("removes the logo", async () => {
    const api = installDocuments({ [ORGANIZATION_ROUTE]: organizationReply({ hasLogo: true }) });
    const { user } = renderDocuments();

    await user.click(await screen.findByRole("button", { name: text.removeLogo }));

    expect(await screen.findByText(text.logoRemoved)).toBeVisible();
    expect(api.requestsTo(REMOVE_LOGO_ROUTE)).toHaveLength(1);
  });

  it("opens the preview in a full screen sheet on mobile", async () => {
    installDocuments();
    const { user } = renderDocuments();

    await user.click(await screen.findByRole("button", { name: text.previewButton }));

    const sheet = await screen.findByRole("dialog", { name: text.previewButton });
    expect(await within(sheet).findByRole("img", { name: text.page(1) })).toBeVisible();
    await user.click(within(sheet).getByRole("button", { name: text.previewBack }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("is read-only for a secretary", async () => {
    installDocuments({}, "secretary");
    renderDocuments();

    expect(
      await screen.findByRole("radio", { name: new RegExp(TEMPLATE_TEXTS.plain.label) }),
    ).toBeDisabled();
    expect(screen.getByLabelText(labelled(text.email))).toBeDisabled();
    expect(screen.getByLabelText(text.addLogo)).toBeDisabled();
    expect(screen.getByText(settingsFr.readOnly)).toBeVisible();
    expect(screen.queryByRole("button", { name: settingsFr.save })).toBeNull();
  });
});
