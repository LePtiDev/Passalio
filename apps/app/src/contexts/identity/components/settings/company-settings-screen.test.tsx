import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { errorReply, heldReply, installFakeApi, type FakeRoutes } from "@/test-support/fake-api";
import {
  forgetToasts,
  noContentReply,
  ORGANIZATION_ROUTE,
  organizationReply,
  SHORT_TRACE_ID,
  signedInRoutes,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import {
  DOCUMENT_SETTINGS_ROUTE,
  documentSettingsReply,
  UPDATE_ORGANIZATION_ROUTE,
} from "@/test-support/settings-replies";
import type { OrganizationRole } from "@passalio/shared";
import {
  LEGAL_FORM_LABELS,
  LEGAL_MENTION_LABELS,
  REGISTRY_LABELS,
  settingsFr,
} from "../../settings-fr";
import { CompanySettingsScreen } from "./company-settings-screen";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = settingsFr.company;

const installCompany = (routes: FakeRoutes = {}, role: OrganizationRole = "owner") =>
  installFakeApi({
    ...signedInRoutes(role),
    [ORGANIZATION_ROUTE]: organizationReply(),
    [DOCUMENT_SETTINGS_ROUTE]: documentSettingsReply(),
    [UPDATE_ORGANIZATION_ROUTE]: noContentReply(),
    ...routes,
  });

const renderCompany = () =>
  renderScreen(<CompanySettingsScreen />, { path: "/reglages/entreprise" });

const labelled = (label: string) =>
  new RegExp(`^${label.replaceAll(/[()]/g, String.raw`\$&`)}\\*?$`);

const legalLine = () =>
  (screen.getAllByTestId("legal-line")[0]?.textContent ?? "").replaceAll("\u00A0", " ");

describe("CompanySettingsScreen", () => {
  afterEach(forgetToasts);

  it("shows a skeleton, then the saved legal details and the certificate line", async () => {
    const settings = heldReply(documentSettingsReply());
    installCompany({ [DOCUMENT_SETTINGS_ROUTE]: settings.reply });
    renderCompany();

    expect(await screen.findByLabelText(settingsFr.loading)).toHaveAttribute("aria-busy", "true");
    settings.release();

    expect(await screen.findByLabelText(labelled(text.name))).toHaveValue("Ramonage Dupont");
    expect(screen.getByRole("combobox", { name: labelled(text.legalForm) })).toHaveTextContent(
      LEGAL_FORM_LABELS.sarl,
    );
    expect(legalLine()).toBe(
      "Ramonage Dupont SARL au capital de 5 000 € · SIREN 123 456 789 RCS Lyon · siège : 12 rue des Lilas, 69003 Lyon",
    );
    expect(screen.queryByText(text.missingTitle)).toBeNull();
  });

  it("lists the legal mentions still missing", async () => {
    installCompany({
      [DOCUMENT_SETTINGS_ROUTE]: documentSettingsReply({
        legalForm: null,
        shareCapitalEuros: null,
        missingLegalMentions: ["legalForm", "shareCapitalEuros"],
      }),
    });
    renderCompany();

    expect(await screen.findByText(text.missingTitle)).toBeVisible();
    expect(
      screen.getByText(
        `${LEGAL_MENTION_LABELS.legalForm}, ${LEGAL_MENTION_LABELS.shareCapitalEuros}`,
      ),
    ).toBeVisible();
  });

  it("shows a load error with the short trace id and retries", async () => {
    const api = installCompany({ [DOCUMENT_SETTINGS_ROUTE]: errorReply("internal", TRACE_ID) });
    const { user } = renderCompany();

    expect(await screen.findByText(settingsFr.loadFailed)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();

    api.setRoute(DOCUMENT_SETTINGS_ROUTE, documentSettingsReply());
    await user.click(screen.getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByLabelText(labelled(text.name))).toBeVisible();
  });

  it("updates the certificate line while typing and marks what is missing", async () => {
    installCompany();
    const { user } = renderCompany();

    const capital = await screen.findByLabelText(labelled(text.shareCapital));
    await user.clear(capital);
    await user.clear(screen.getByLabelText(labelled(text.registryCity)));

    expect(legalLine()).toContain(
      `SARL ${text.line.capitalLabel} ${text.toFix} · SIREN 123 456 789 RCS ${text.toFix}`,
    );
    expect(screen.getAllByText(settingsFr.unsavedChanges(2)).length).toBeGreaterThan(0);
  });

  it("refuses to save a company without share capital", async () => {
    const api = installCompany();
    const { user } = renderCompany();

    await user.clear(await screen.findByLabelText(labelled(text.shareCapital)));
    await user.click(screen.getByRole("button", { name: settingsFr.save }));

    expect(await screen.findByText(text.errors.shareCapital)).toBeVisible();
    expect(screen.getByText(settingsFr.fieldsToFix(1))).toBeVisible();
    expect(api.requestsTo(UPDATE_ORGANIZATION_ROUTE)).toHaveLength(0);
  });

  it("saves only the changed fields and confirms", async () => {
    const update = heldReply(noContentReply());
    const api = installCompany({ [UPDATE_ORGANIZATION_ROUTE]: update.reply });
    const { user } = renderCompany();

    await user.click(await screen.findByRole("combobox", { name: labelled(text.registry) }));
    await user.click(await screen.findByRole("option", { name: REGISTRY_LABELS.rne }));
    const ape = screen.getByLabelText(labelled(text.apeCode));
    await user.clear(ape);
    await user.click(screen.getByRole("button", { name: settingsFr.save }));

    expect(await screen.findByRole("button", { name: settingsFr.saving })).toBeDisabled();
    update.release();

    expect(await screen.findByText(settingsFr.saved)).toBeVisible();
    expect(api.requestsTo(UPDATE_ORGANIZATION_ROUTE)[0]?.body).toEqual({
      registryKind: "rne",
      registryCity: null,
      apeCode: null,
    });
    await waitFor(() =>
      expect(screen.queryAllByText(settingsFr.unsavedChanges(3))).toHaveLength(0),
    );
  });

  it("cancels the unsaved changes", async () => {
    installCompany();
    const { user } = renderCompany();

    const name = await screen.findByLabelText(labelled(text.name));
    await user.type(name, " et fils");
    await user.click(screen.getByRole("button", { name: settingsFr.cancel }));

    expect(name).toHaveValue("Ramonage Dupont");
  });

  it("shows a refused SIRET with the short trace id", async () => {
    installCompany({ [UPDATE_ORGANIZATION_ROUTE]: errorReply("invalid_siret", TRACE_ID, 422) });
    const { user } = renderCompany();

    await user.type(await screen.findByLabelText(labelled(text.name)), " et fils");
    await user.click(screen.getByRole("button", { name: settingsFr.save }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.invalid_siret);
    expect(alert).toHaveTextContent(fr.errors.code(SHORT_TRACE_ID));
  });

  it("is read-only for a technician", async () => {
    installCompany({}, "technician");
    renderCompany();

    expect(await screen.findByLabelText(labelled(text.name))).toBeDisabled();
    expect(screen.getByText(settingsFr.readOnly)).toBeVisible();
    expect(screen.queryByRole("button", { name: settingsFr.save })).toBeNull();
  });
});
