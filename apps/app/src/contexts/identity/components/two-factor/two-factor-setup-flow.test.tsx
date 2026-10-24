import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { routeWindowFetchToFakeApi } from "@/test-support/happy-dom-window";
import { renderScreen } from "@/test-support/render-screen";
import { twoFactorFr } from "../../two-factor-fr";
import { TwoFactorSetup } from "./two-factor-setup";

const text = twoFactorFr.setup;

const ENABLE_ROUTE = "POST /api/auth/two-factor/enable";
const VERIFY_ROUTE = "POST /api/auth/two-factor/verify-totp";

const TRACE_ID = "2d4f6a8c-0e1b-4c3d-9e5f-7a9b1c3d5e7f";

const BACKUP_CODES = ["AAAA-1111", "BBBB-2222", "CCCC-3333"];

const ENROLLMENT = {
  totpURI: "otpauth://totp/Passalio:quentin@passalio.test?secret=JBSWY3DPEHPK3PXP&issuer=Passalio",
  backupCodes: BACKUP_CODES,
};

const authError = (code: string, status: number) =>
  jsonReply({ code, message: code, traceId: TRACE_ID }, status);

const renderSetup = (routes: Parameters<typeof installFakeApi>[0]) => {
  const api = installFakeApi(routes);
  routeWindowFetchToFakeApi(api);
  const onDone = vi.fn<() => void>();
  const rendered = renderScreen(<TwoFactorSetup onDone={onDone} />, { path: "/admin/securite" });
  return { ...rendered, api, onDone };
};

const confirmPassword = async (user: ReturnType<typeof renderSetup>["user"]) => {
  await user.type(await screen.findByLabelText(text.passwordLabel), "mot-de-passe-solide");
  await user.click(screen.getByRole("button", { name: text.continue }));
};

describe("TwoFactorSetup", () => {
  it("asks for the password before calling the server", async () => {
    const { user, api } = renderSetup({});

    await user.click(await screen.findByRole("button", { name: text.continue }));

    expect(await screen.findByText(text.passwordRequired)).toBeVisible();
    expect(screen.getByLabelText(text.passwordLabel)).toHaveAttribute("aria-invalid", "true");
    expect(api.requestsTo(ENABLE_ROUTE)).toHaveLength(0);
  });

  it("shows a wrong password under the field", async () => {
    const { user } = renderSetup({ [ENABLE_ROUTE]: authError("INVALID_PASSWORD", 400) });

    await confirmPassword(user);

    expect(await screen.findByText(fr.errors.messages.invalid_password)).toBeVisible();
    expect(screen.getByRole("heading", { name: text.title })).toBeVisible();
    expect(screen.queryByText(text.scanTitle)).toBeNull();
  });

  it("shows an unexpected server error in a toast with the short trace id", async () => {
    const { user } = renderSetup({ [ENABLE_ROUTE]: authError("INTERNAL", 500) });

    await confirmPassword(user);

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    expect(screen.getByRole("button", { name: text.continue })).toBeEnabled();
  });

  it("disables the button while the password is being checked", async () => {
    const enable = heldReply(jsonReply(ENROLLMENT));
    const { user } = renderSetup({ [ENABLE_ROUTE]: enable.reply });

    await confirmPassword(user);

    await waitFor(() => expect(screen.getByRole("button", { name: text.continue })).toBeDisabled());
    enable.release();

    expect(await screen.findByText(text.scanTitle)).toBeVisible();
  });

  it("shows the QR code with the manual key after the password is confirmed", async () => {
    const { user, api } = renderSetup({ [ENABLE_ROUTE]: jsonReply(ENROLLMENT) });

    await confirmPassword(user);

    expect(await screen.findByText(text.scanTitle)).toBeVisible();
    expect(screen.getByText(text.qrLabel)).toBeInTheDocument();
    expect(screen.getByText("JBSW Y3DP EHPK 3PXP")).toBeVisible();
    expect(screen.getByLabelText(text.codeLabel)).toBeVisible();
    expect(api.requestsTo(ENABLE_ROUTE)[0]?.body).toEqual({ password: "mot-de-passe-solide" });
  });

  it("asks for the code before verifying it", async () => {
    const { user, api } = renderSetup({ [ENABLE_ROUTE]: jsonReply(ENROLLMENT) });

    await confirmPassword(user);
    await user.click(await screen.findByRole("button", { name: text.activate }));

    expect(await screen.findByText(twoFactorFr.code.required)).toBeVisible();
    expect(api.requestsTo(VERIFY_ROUTE)).toHaveLength(0);
  });

  it("shows a wrong code under the field and stays on the scan step", async () => {
    const { user } = renderSetup({
      [ENABLE_ROUTE]: jsonReply(ENROLLMENT),
      [VERIFY_ROUTE]: authError("INVALID_CODE", 401),
    });

    await confirmPassword(user);
    await user.type(await screen.findByLabelText(text.codeLabel), "123456");
    await user.click(screen.getByRole("button", { name: text.activate }));

    expect(await screen.findByText(fr.errors.messages.invalid_two_factor_code)).toBeVisible();
    expect(screen.getByText(text.scanTitle)).toBeVisible();
  });

  it("shows the backup codes once the code is verified, copies them and finishes", async () => {
    const verify = heldReply(jsonReply({ token: "session" }));
    const { user, api, onDone } = renderSetup({
      [ENABLE_ROUTE]: jsonReply(ENROLLMENT),
      [VERIFY_ROUTE]: verify.reply,
    });

    await confirmPassword(user);
    await user.type(await screen.findByLabelText(text.codeLabel), "123456");
    await user.click(screen.getByRole("button", { name: text.activate }));

    expect(await screen.findByRole("button", { name: text.activating })).toBeDisabled();
    verify.release();

    const codes = await screen.findByRole("list", { name: twoFactorFr.backupCodes.listLabel });
    expect(
      within(codes)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(BACKUP_CODES);
    expect(api.requestsTo(VERIFY_ROUTE)[0]?.body).toEqual({ code: "123456" });

    await user.click(screen.getByRole("button", { name: twoFactorFr.backupCodes.copy }));
    expect(await screen.findByText(twoFactorFr.backupCodes.copied)).toBeVisible();
    expect(await navigator.clipboard.readText()).toBe(BACKUP_CODES.join("\n"));

    expect(onDone).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: twoFactorFr.backupCodes.done }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("signs out from the password step and goes back to the sign-in page", async () => {
    const { user, api, router } = renderSetup({
      "POST /api/auth/sign-out": jsonReply({ success: true }),
    });

    await user.click(await screen.findByRole("button", { name: text.signOut }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/connexion"));
    expect(api.requestsTo("POST /api/auth/sign-out")).toHaveLength(1);
  });
});
