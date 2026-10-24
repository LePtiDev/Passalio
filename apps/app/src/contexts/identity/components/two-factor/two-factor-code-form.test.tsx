import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import {
  authErrorReply,
  forgetToasts,
  SHORT_TRACE_ID,
  SIGN_OUT_ROUTE,
  signedOutRoutes,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { twoFactorFr } from "../../two-factor-fr";
import { TwoFactorCodeForm } from "./two-factor-code-form";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = twoFactorFr.code;

const VERIFY_TOTP_ROUTE = "POST /api/auth/two-factor/verify-totp";
const VERIFY_BACKUP_ROUTE = "POST /api/auth/two-factor/verify-backup-code";

const verifiedReply = jsonReply({ token: "session-token", user: null });

const renderCodeForm = () => {
  const onVerified = vi.fn<() => Promise<void>>(async () => undefined);
  const rendered = renderScreen(
    <TwoFactorCodeForm subtitle={text.subtitle} onVerified={onVerified} />,
    {
      path: "/connexion/code",
    },
  );
  return { ...rendered, onVerified };
};

describe("TwoFactorCodeForm", () => {
  afterEach(forgetToasts);

  it("asks for the code when the user submits nothing", async () => {
    const api = installFakeApi({ ...signedOutRoutes(), [VERIFY_TOTP_ROUTE]: verifiedReply });
    const { user, onVerified } = renderCodeForm();

    await user.click(await screen.findByRole("button", { name: text.submit }));

    expect(await screen.findByText(text.required)).toBeVisible();
    expect(api.requestsTo(VERIFY_TOTP_ROUTE)).toHaveLength(0);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("verifies the six-digit code and continues", async () => {
    const verify = heldReply(verifiedReply);
    const api = installFakeApi({ ...signedOutRoutes(), [VERIFY_TOTP_ROUTE]: verify.reply });
    const { user, onVerified } = renderCodeForm();

    await user.type(await screen.findByLabelText(text.label), "123456");
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByRole("button", { name: text.submitting })).toBeDisabled();
    verify.release();

    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce());
    expect(api.requestsTo(VERIFY_TOTP_ROUTE)[0]?.body).toEqual({ code: "123456" });
  });

  it("shows a wrong code next to the field", async () => {
    installFakeApi({
      ...signedOutRoutes(),
      [VERIFY_TOTP_ROUTE]: authErrorReply("INVALID_CODE", 401),
    });
    const { user, onVerified } = renderCodeForm();

    await user.type(await screen.findByLabelText(text.label), "000000");
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.invalid_two_factor_code)).toBeVisible();
    expect(screen.getByRole("button", { name: text.submit })).toBeEnabled();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("shows a blocked account in a toast with the short trace id", async () => {
    installFakeApi({
      ...signedOutRoutes(),
      [VERIFY_TOTP_ROUTE]: authErrorReply("TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE", 401),
    });
    const { user } = renderCodeForm();

    await user.type(await screen.findByLabelText(text.label), "111111");
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.two_factor_too_many_attempts)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
  });

  it("accepts a backup code instead of the application code", async () => {
    const api = installFakeApi({ ...signedOutRoutes(), [VERIFY_BACKUP_ROUTE]: verifiedReply });
    const { user, onVerified } = renderCodeForm();

    await user.click(await screen.findByRole("button", { name: text.switchToBackup }));
    expect(screen.getByText(text.backupHint)).toBeVisible();
    await user.type(screen.getByLabelText(text.backupLabel), "ABCD-1234");
    await user.click(screen.getByRole("button", { name: text.submit }));

    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce());
    expect(api.requestsTo(VERIFY_BACKUP_ROUTE)[0]?.body).toEqual({ code: "ABCD-1234" });

    await user.click(screen.getByRole("button", { name: text.switchToApp }));
    expect(screen.getByLabelText(text.label)).toBeVisible();
  });

  it("signs out and returns to sign-in to change account", async () => {
    const api = installFakeApi({
      ...signedOutRoutes(),
      [SIGN_OUT_ROUTE]: jsonReply({ success: true }),
    });
    const { user, router } = renderCodeForm();

    await user.click(await screen.findByRole("button", { name: text.changeAccount }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/connexion"));
    expect(api.requestsTo(SIGN_OUT_ROUTE)).toHaveLength(1);
  });
});
