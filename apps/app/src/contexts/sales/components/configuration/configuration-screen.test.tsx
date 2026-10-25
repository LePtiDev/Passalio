import type { MailSettingsResponse } from "@passalio/shared";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PlatformAdmin } from "@/contexts/backoffice";
import { prospectFilters } from "@/test-support/sales-records";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { findBusyElement, skeletonsIn } from "@/test-support/skeletons";
import { dismissAllToasts } from "@/test-support/toasts";
import { configurationFr } from "../../fr-configuration";
import { ConfigurationScreen } from "./configuration-screen";
import type { ConfigurationTab } from "./configuration-form-schema";

const text = configurationFr;

const TRACE_ID = "4f1e2d3c-b4a5-4c6d-8e7f-0a1b2c3d4e5f";

const ANTHO: PlatformAdmin = {
  userId: "user-antho",
  email: "antho@passalio.fr",
  name: "Antho",
  role: "sales",
};

const QUENTIN: PlatformAdmin = {
  userId: "user-quentin",
  email: "quentin@passalio.fr",
  name: "Quentin",
  role: "superadmin",
};

const SETTINGS_ROUTE = (userId: string) => `GET /api/admin/mail-settings/${userId}` as const;

const SAVE_ROUTE = (userId: string) => `PUT /api/admin/mail-settings/${userId}` as const;

const TEST_ROUTE = (userId: string) => `POST /api/admin/mail-settings/${userId}/test` as const;

const FILTERS_ROUTE = "GET /api/admin/prospects/filters";

const SAVED: NonNullable<MailSettingsResponse["settings"]> = {
  senderName: "Antho, Passalio",
  senderAddress: "antho@passalio.fr",
  replyTo: null,
  provider: "ovh_email_pro",
  smtpHost: "pro1.mail.ovh.net",
  smtpPort: 587,
  smtpUsername: "antho@passalio.fr",
  hasPassword: true,
  passwordUpdatedAt: "2026-10-24T07:40:00.000Z",
  verifiedAt: null,
  signature: null,
  reminderNotify: "minutes_15",
  reminderAddress: null,
  updatedAt: "2026-10-24T07:40:00.000Z",
  updatedBy: null,
};

const response = (
  settings: MailSettingsResponse["settings"],
  member = { name: "Antho", email: "antho@passalio.fr" },
  userId = ANTHO.userId,
): MailSettingsResponse => ({ userId, member, settings });

const renderConfiguration = ({
  admin = ANTHO,
  memberId,
  tab = "boite",
}: {
  readonly admin?: PlatformAdmin;
  readonly memberId?: string;
  readonly tab?: ConfigurationTab;
} = {}) =>
  renderScreen(<ConfigurationScreen admin={admin} memberId={memberId} tab={tab} />, {
    path: "/admin/configuration",
  });

const saveButton = () => screen.getAllByRole("button", { name: text.save })[0];

const clickSave = async (user: ReturnType<typeof renderConfiguration>["user"]) => {
  const button = saveButton();
  if (button === undefined) {
    throw new Error("the screen has a save button");
  }
  await user.click(button);
};

describe("ConfigurationScreen", () => {
  it("starts a new mailbox from the member and the Zoho preset, and asks for the password", async () => {
    const api = installFakeApi({
      [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(response(null)),
      [SAVE_ROUTE(ANTHO.userId)]: jsonReply(undefined, 204),
    });
    const { user } = renderConfiguration();

    expect(await screen.findByRole("region", { name: text.status.none })).toBeVisible();
    expect(screen.getByLabelText(new RegExp(text.sender.senderName))).toHaveValue("Antho");
    expect(screen.getByLabelText(new RegExp(text.connection.host))).toHaveValue("smtp.zoho.eu");
    expect(screen.getByRole("button", { name: text.connection.test })).toBeDisabled();
    expect(screen.getByText(text.connection.saveFirst)).toBeVisible();

    await clickSave(user);

    expect(await screen.findByText(text.errors.required)).toBeVisible();
    expect(api.requestsTo(SAVE_ROUTE(ANTHO.userId))).toEqual([]);

    await user.type(
      screen.getByLabelText(new RegExp(text.connection.password)),
      "mot-de-passe-application",
    );
    await clickSave(user);

    expect(await screen.findByText(text.saved)).toBeVisible();
    expect(api.requestsTo(SAVE_ROUTE(ANTHO.userId))[0]?.body).toEqual({
      senderName: "Antho",
      senderAddress: "antho@passalio.fr",
      replyTo: null,
      provider: "zoho",
      smtpHost: "smtp.zoho.eu",
      smtpPort: 465,
      smtpUsername: "antho@passalio.fr",
      smtpPassword: "mot-de-passe-application",
      signature: null,
      reminderNotify: "minutes_15",
      reminderAddress: null,
    });
  });

  it("fills the server and port when the provider changes", async () => {
    installFakeApi({ [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(response(null)) });
    const { user } = renderConfiguration();

    await user.click(await screen.findByRole("combobox", { name: text.sender.provider }));
    await user.click(await screen.findByRole("option", { name: text.providers.ovh_email_pro }));

    expect(screen.getByLabelText(new RegExp(text.connection.host))).toHaveValue(
      "pro1.mail.ovh.net",
    );
    expect(screen.getByRole("combobox", { name: text.connection.port })).toHaveTextContent(
      text.ports[587],
    );
  });

  it("keeps the saved password and tests the saved mailbox", async () => {
    const api = installFakeApi({
      [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(response(SAVED)),
      [TEST_ROUTE(ANTHO.userId)]: jsonReply({
        sentTo: "antho@passalio.fr",
        verifiedAt: "2026-10-25T08:41:00.000Z",
      }),
    });
    const { user } = renderConfiguration();

    expect(await screen.findByRole("region", { name: text.status.untested })).toBeVisible();
    const password = screen.getByLabelText(new RegExp(text.connection.password));
    expect(password).toHaveValue("");
    expect(password).not.toBeRequired();
    expect(password).not.toHaveAttribute("aria-required");
    expect(screen.queryByRole("link", { name: /mot de passe d'application/ })).toBeNull();

    api.setRoute(
      SETTINGS_ROUTE(ANTHO.userId),
      jsonReply(response({ ...SAVED, verifiedAt: "2026-10-25T08:41:00.000Z" })),
    );
    await user.click(screen.getByRole("button", { name: text.connection.test }));

    expect(await screen.findByText(text.connection.testSent("antho@passalio.fr"))).toBeVisible();
    expect(await screen.findByRole("region", { name: text.status.connected })).toBeVisible();
    expect(screen.getByText(/Connexion réussie/)).toBeVisible();
  });

  it("waits for the changes to be saved before testing", async () => {
    installFakeApi({ [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(response(SAVED)) });
    const { user } = renderConfiguration();

    const test = await screen.findByRole("button", { name: text.connection.test });
    expect(test).toBeEnabled();
    await user.type(screen.getByLabelText(new RegExp(text.connection.username)), "x");

    expect(test).toBeDisabled();
    expect(screen.getByText(text.connection.saveFirst)).toBeVisible();
  });

  it("explains a refused test next to the button, with its short code", async () => {
    installFakeApi({
      [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(response(SAVED)),
      [TEST_ROUTE(ANTHO.userId)]: errorReply("smtp_auth_failed", TRACE_ID, 422),
    });
    const { user } = renderConfiguration();

    await user.click(await screen.findByRole("button", { name: text.connection.test }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Le serveur refuse l'identifiant ou le mot de passe d'application.",
    );
    expect(alert).toHaveTextContent("4f1e2d3c");
  });

  it("links to the app password page of Zoho and Google", async () => {
    installFakeApi({
      [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(response({ ...SAVED, provider: "google" })),
    });
    renderConfiguration();

    expect(
      await screen.findByRole("link", { name: text.connection.appPassword.google }),
    ).toHaveAttribute("href", "https://myaccount.google.com/apppasswords");
  });

  it("shows the reminders and the signature rubrics", async () => {
    installFakeApi({
      [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(
        response({ ...SAVED, reminderAddress: "rappels@passalio.fr", signature: "Antho" }),
      ),
    });
    const reminders = renderConfiguration({ tab: "rappels" });

    expect(await screen.findByLabelText(text.reminders.address)).toHaveValue("rappels@passalio.fr");
    expect(screen.getByRole("combobox", { name: text.reminders.notify })).toHaveTextContent(
      "15 min avant",
    );
    expect(screen.queryByLabelText(new RegExp(text.connection.host))).toBeNull();
    reminders.unmount();

    renderConfiguration({ tab: "signature" });
    expect(await screen.findByRole("textbox", { name: text.signature.label })).toHaveValue("Antho");
  });

  it("shows the member's account in the profile rubric", async () => {
    installFakeApi({ [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(response(SAVED)) });
    renderConfiguration({ tab: "profil" });

    const profile = await screen.findByRole("region", { name: text.profile.title });
    expect(within(profile).getByText("antho@passalio.fr")).toBeVisible();
    expect(within(profile).getByText(text.profile.roles.sales)).toBeVisible();
  });

  it("marks the current rubric and keeps the member in the rubric links", async () => {
    installFakeApi({
      [SETTINGS_ROUTE("user-antho")]: jsonReply(response(SAVED)),
      [FILTERS_ROUTE]: jsonReply(prospectFilters()),
    });
    renderConfiguration({ admin: QUENTIN, memberId: "user-antho", tab: "rappels" });

    const rubrics = await screen.findByRole("navigation", { name: text.rubrics });
    expect(within(rubrics).getByRole("link", { name: text.tabs.rappels })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(rubrics).getByRole("link", { name: text.tabs.signature })).toHaveAttribute(
      "href",
      "/admin/configuration?membre=user-antho&rubrique=signature",
    );
  });

  it("warns an admin who edits another member and offers the member list", async () => {
    installFakeApi({
      [SETTINGS_ROUTE("user-antho")]: jsonReply(response(SAVED)),
      [FILTERS_ROUTE]: jsonReply(prospectFilters()),
    });
    renderConfiguration({ admin: QUENTIN, memberId: "user-antho" });

    expect(await screen.findByText(text.otherMember.title("Antho"))).toBeVisible();
    expect(screen.getAllByRole("combobox", { name: text.member })).toHaveLength(2);
  });

  it("never lets a salesperson pick another member", async () => {
    const api = installFakeApi({ [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(response(SAVED)) });
    renderConfiguration({ memberId: "user-quentin" });

    expect(await screen.findByRole("region", { name: text.status.untested })).toBeVisible();
    expect(screen.queryByRole("combobox", { name: text.member })).toBeNull();
    expect(screen.queryByText(text.otherMember.title("Antho"))).toBeNull();
    expect(api.requestsTo(SETTINGS_ROUTE("user-quentin"))).toEqual([]);
  });

  it("shows section skeletons while loading", async () => {
    const held = heldReply(jsonReply(response(SAVED)));
    installFakeApi({ [SETTINGS_ROUTE(ANTHO.userId)]: held.reply });
    const { container } = renderConfiguration();

    const busy = await findBusyElement(container);
    expect(skeletonsIn(busy).length).toBeGreaterThan(10);
    expect(saveButton()).toBeDisabled();
    held.release();
    expect(await screen.findByRole("region", { name: text.status.untested })).toBeVisible();
  });

  it("shows the load error with its code and retries", async () => {
    const api = installFakeApi({
      [SETTINGS_ROUTE(ANTHO.userId)]: errorReply("internal", TRACE_ID),
    });
    const { user } = renderConfiguration();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(text.loadFailed);
    expect(alert).toHaveTextContent("4f1e2d3c");
    api.setRoute(SETTINGS_ROUTE(ANTHO.userId), jsonReply(response(SAVED)));
    await user.click(within(alert).getByRole("button"));

    expect(await screen.findByRole("region", { name: text.status.untested })).toBeVisible();
  });

  it("toasts a save refused by the server with its short code", async () => {
    dismissAllToasts();
    installFakeApi({
      [SETTINGS_ROUTE(ANTHO.userId)]: jsonReply(response(SAVED)),
      [SAVE_ROUTE(ANTHO.userId)]: errorReply("internal", TRACE_ID),
    });
    const { user } = renderConfiguration();

    await screen.findByRole("region", { name: text.status.untested });
    await clickSave(user);

    expect(await screen.findByText(/4f1e2d3c/)).toBeVisible();
    expect(screen.queryByText(text.saved)).toBeNull();
  });
});
