import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { installFakeApi, jsonReply } from "@/test-support/fake-api";
import {
  authErrorReply,
  forgetToasts,
  SHORT_TRACE_ID,
  signedOutRoutes,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { twoFactorFr } from "../../two-factor-fr";
import { TwoFactorSetup } from "./two-factor-setup";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = twoFactorFr.setup;

const ENABLE_ROUTE = "POST /api/auth/two-factor/enable";
const VERIFY_TOTP_ROUTE = "POST /api/auth/two-factor/verify-totp";

const BACKUP_CODES = ["AAAA-1111", "BBBB-2222", "CCCC-3333"];

const enabledReply = jsonReply({
  totpURI: "otpauth://totp/Passalio:paul?secret=JBSWY3DPEHPK3PXP&issuer=Passalio",
  backupCodes: BACKUP_CODES,
});

const renderSetup = () => {
  const onDone = vi.fn<() => void>();
  return {
    ...renderScreen(<TwoFactorSetup onDone={onDone} />, { path: "/admin/securite" }),
    onDone,
  };
};

describe("TwoFactorSetup", () => {
  afterEach(forgetToasts);

  it("asks for the current password first", async () => {
    const api = installFakeApi({ ...signedOutRoutes(), [ENABLE_ROUTE]: enabledReply });
    const { user } = renderSetup();

    await user.click(await screen.findByRole("button", { name: text.continue }));

    expect(await screen.findByText(text.passwordRequired)).toBeVisible();
    expect(api.requestsTo(ENABLE_ROUTE)).toHaveLength(0);
  });

  it("shows a wrong password next to the field", async () => {
    installFakeApi({
      ...signedOutRoutes(),
      [ENABLE_ROUTE]: authErrorReply("INVALID_PASSWORD", 400),
    });
    const { user } = renderSetup();

    await user.type(await screen.findByLabelText(text.passwordLabel), "mauvais mot de passe");
    await user.click(screen.getByRole("button", { name: text.continue }));

    expect(await screen.findByText(fr.errors.messages.invalid_password)).toBeVisible();
    expect(screen.getByLabelText(text.passwordLabel)).toHaveAttribute("aria-invalid", "true");
  });

  it("shows an unexpected failure with the short trace id", async () => {
    installFakeApi({ ...signedOutRoutes(), [ENABLE_ROUTE]: authErrorReply("FAILED", 500) });
    const { user } = renderSetup();

    await user.type(await screen.findByLabelText(text.passwordLabel), "un mot de passe solide");
    await user.click(screen.getByRole("button", { name: text.continue }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
  });

  it("walks from the QR code to the backup codes and finishes", async () => {
    const api = installFakeApi({
      ...signedOutRoutes(),
      [ENABLE_ROUTE]: enabledReply,
      [VERIFY_TOTP_ROUTE]: jsonReply({ token: "session-token" }),
    });
    const { user, onDone } = renderSetup();

    await user.type(await screen.findByLabelText(text.passwordLabel), "un mot de passe solide");
    await user.click(screen.getByRole("button", { name: text.continue }));

    expect(await screen.findByText(text.scanTitle)).toBeVisible();
    expect(screen.getByText(text.qrLabel)).toBeInTheDocument();
    expect(screen.getByText("JBSW Y3DP EHPK 3PXP")).toBeVisible();
    expect(api.requestsTo(ENABLE_ROUTE)[0]?.body).toEqual({ password: "un mot de passe solide" });

    await user.click(screen.getByRole("button", { name: text.activate }));
    expect(await screen.findByText(twoFactorFr.code.required)).toBeVisible();

    await user.type(screen.getByLabelText(text.codeLabel), "123456");
    await user.click(screen.getByRole("button", { name: text.activate }));

    const codes = await screen.findByRole("list", { name: twoFactorFr.backupCodes.listLabel });
    expect(
      within(codes)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(BACKUP_CODES);
    expect(api.requestsTo(VERIFY_TOTP_ROUTE)[0]?.body).toEqual({ code: "123456" });

    await user.click(screen.getByRole("button", { name: twoFactorFr.backupCodes.done }));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("shows a wrong activation code next to the field", async () => {
    installFakeApi({
      ...signedOutRoutes(),
      [ENABLE_ROUTE]: enabledReply,
      [VERIFY_TOTP_ROUTE]: authErrorReply("INVALID_CODE", 401),
    });
    const { user } = renderSetup();

    await user.type(await screen.findByLabelText(text.passwordLabel), "un mot de passe solide");
    await user.click(screen.getByRole("button", { name: text.continue }));
    await user.type(await screen.findByLabelText(text.codeLabel), "000000");
    await user.click(screen.getByRole("button", { name: text.activate }));

    expect(await screen.findByText(fr.errors.messages.invalid_two_factor_code)).toBeVisible();
    expect(screen.queryByRole("list", { name: twoFactorFr.backupCodes.listLabel })).toBeNull();
  });

  it("copies the backup codes and confirms with a toast", async () => {
    installFakeApi({
      ...signedOutRoutes(),
      [ENABLE_ROUTE]: enabledReply,
      [VERIFY_TOTP_ROUTE]: jsonReply({ token: "session-token" }),
    });
    const { user } = renderSetup();

    await user.type(await screen.findByLabelText(text.passwordLabel), "un mot de passe solide");
    await user.click(screen.getByRole("button", { name: text.continue }));
    await user.type(await screen.findByLabelText(text.codeLabel), "123456");
    await user.click(screen.getByRole("button", { name: text.activate }));
    await user.click(await screen.findByRole("button", { name: twoFactorFr.backupCodes.copy }));

    expect(await screen.findByText(twoFactorFr.backupCodes.copied)).toBeVisible();
    expect(await navigator.clipboard.readText()).toBe(BACKUP_CODES.join("\n"));
  });
});
