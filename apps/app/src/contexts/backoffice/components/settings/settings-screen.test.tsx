import type { SignUpSettingsResponse } from "@passalio/shared";
import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { settingsFr } from "../../settings-fr";
import { SettingsScreen } from "./settings-screen";

const SETTINGS_ROUTE = "GET /api/admin/settings/sign-up";
const CHANGE_ROUTE = "PUT /api/admin/settings/sign-up";

const TRACE_ID = "7f3a91c2-5b4a-4392-8170-6f5e4d3c2b1a";

const text = settingsFr.signUp;

const settings = (overrides: Partial<SignUpSettingsResponse> = {}) => ({
  settings: { isSignUpOpen: true, changedAt: null, changedByName: null, ...overrides },
});

const CLOSED = settings({
  isSignUpOpen: false,
  changedAt: "2026-10-24T21:10:00.000Z",
  changedByName: "Quentin",
});

const renderSettings = (hostname = "app.passalio.com") =>
  renderScreen(<SettingsScreen hostname={hostname} host={hostname} />, {
    path: "/admin/reglages",
  });

const signUpSwitch = () => screen.findByRole("switch", { name: text.switchLabel });

describe("SettingsScreen", () => {
  it("shows a skeleton of the settings while they load", async () => {
    const reply = heldReply(jsonReply(settings()));
    installFakeApi({ [SETTINGS_ROUTE]: reply.reply });

    renderSettings();

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();

    reply.release();

    expect(await signUpSwitch()).toBeInTheDocument();
    expect(busyRegions()).toHaveLength(0);
  });

  it("shows the error with the short trace id and loads the settings again on retry", async () => {
    const api = installFakeApi({ [SETTINGS_ROUTE]: errorReply("internal", TRACE_ID) });

    const { user } = renderSettings();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(settingsFr.loadError);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));

    api.setRoute(SETTINGS_ROUTE, jsonReply(settings()));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await signUpSwitch()).toBeChecked();
  });

  it("shows open sign-up with what stays possible and what is refused", async () => {
    installFakeApi({ [SETTINGS_ROUTE]: jsonReply(settings()) });

    renderSettings();

    expect(await signUpSwitch()).toBeChecked();
    expect(screen.getByText(text.openDescription)).toBeVisible();
    expect(screen.getByText(text.neverChanged)).toBeInTheDocument();
    for (const rule of [...text.allowed, ...text.blocked]) {
      expect(screen.getByText(rule)).toBeInTheDocument();
    }
    expect(screen.getAllByText("Production").length).toBeGreaterThan(0);
  });

  it("shows closed sign-up with who closed it and when", async () => {
    installFakeApi({ [SETTINGS_ROUTE]: jsonReply(CLOSED) });

    renderSettings();

    expect(await signUpSwitch()).not.toBeChecked();
    expect(screen.getByText(text.closedDescription)).toBeVisible();
    expect(screen.getByText("Fermées par Quentin le 24 oct. à 23:10.")).toBeInTheDocument();
  });

  it("asks for confirmation, then closes sign-up and confirms it with a toast", async () => {
    const api = installFakeApi({
      [SETTINGS_ROUTE]: jsonReply(settings()),
      [CHANGE_ROUTE]: jsonReply(CLOSED),
    });

    const { user } = renderSettings();

    await user.click(await signUpSwitch());
    const dialog = await screen.findByRole("alertdialog", {
      name: settingsFr.closeDialog.title("Production"),
    });
    expect(dialog).toHaveTextContent("app.passalio.com");
    expect(api.requestsTo(CHANGE_ROUTE)).toHaveLength(0);

    await user.click(within(dialog).getByRole("button", { name: settingsFr.closeDialog.submit }));

    expect(await screen.findByText(text.closedToast)).toBeVisible();
    expect(api.requestsTo(CHANGE_ROUTE)[0]?.body).toEqual({ isSignUpOpen: false });
    await waitFor(async () => expect(await signUpSwitch()).not.toBeChecked());
  });

  it("keeps sign-up open when the confirmation is dismissed", async () => {
    const api = installFakeApi({ [SETTINGS_ROUTE]: jsonReply(settings()) });

    const { user } = renderSettings();

    await user.click(await signUpSwitch());
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: settingsFr.closeDialog.cancel }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(await signUpSwitch()).toBeChecked();
    expect(api.requestsTo(CHANGE_ROUTE)).toHaveLength(0);
  });

  it("opens sign-up again without confirmation", async () => {
    const api = installFakeApi({
      [SETTINGS_ROUTE]: jsonReply(CLOSED),
      [CHANGE_ROUTE]: jsonReply(settings({ changedAt: "2026-10-25T08:00:00.000Z" })),
    });

    const { user } = renderSettings();

    await user.click(await signUpSwitch());

    expect(await screen.findByText(text.openedToast)).toBeVisible();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(api.requestsTo(CHANGE_ROUTE)[0]?.body).toEqual({ isSignUpOpen: true });
  });

  it("disables the switch while the change is sent", async () => {
    const change = heldReply(jsonReply(settings()));
    installFakeApi({ [SETTINGS_ROUTE]: jsonReply(CLOSED), [CHANGE_ROUTE]: change.reply });

    const { user } = renderSettings();

    await user.click(await signUpSwitch());

    await waitFor(async () => expect(await signUpSwitch()).toBeDisabled());
    change.release();
    await waitFor(async () => expect(await signUpSwitch()).toBeEnabled());
  });

  it("keeps the switch unchanged and shows the short trace id when the change fails", async () => {
    installFakeApi({
      [SETTINGS_ROUTE]: jsonReply(CLOSED),
      [CHANGE_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const { user } = renderSettings();

    await user.click(await signUpSwitch());

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    expect(await signUpSwitch()).not.toBeChecked();
  });

  it("names the staging environment in the confirmation on staging", async () => {
    installFakeApi({ [SETTINGS_ROUTE]: jsonReply(settings()) });

    const { user } = renderSettings("app.staging.passalio.com");

    await user.click(await signUpSwitch());

    expect(
      await screen.findByRole("alertdialog", { name: settingsFr.closeDialog.title("Staging") }),
    ).toHaveTextContent("app.staging.passalio.com");
  });
});
