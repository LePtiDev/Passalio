import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { routeWindowFetchToFakeApi } from "@/test-support/happy-dom-window";
import { renderScreen } from "@/test-support/render-screen";
import { twoFactorFr } from "../../two-factor-fr";
import { TwoFactorCodeForm } from "./two-factor-code-form";

const text = twoFactorFr.code;

const TOTP_ROUTE = "POST /api/auth/two-factor/verify-totp";
const BACKUP_ROUTE = "POST /api/auth/two-factor/verify-backup-code";

const TRACE_ID = "6c5b4a39-2817-4f6e-8d5c-4b3a29180f7e";

const authError = (code: string, status: number) =>
  jsonReply({ code, message: code, traceId: TRACE_ID }, status);

const renderCodeForm = (routes: Parameters<typeof installFakeApi>[0]) => {
  const api = installFakeApi(routes);
  routeWindowFetchToFakeApi(api);
  const onVerified = vi.fn<() => Promise<void>>(async () => undefined);
  const rendered = renderScreen(
    <TwoFactorCodeForm subtitle={text.adminSubtitle} onVerified={onVerified} />,
    { path: "/admin/code" },
  );
  return { ...rendered, api, onVerified };
};

describe("TwoFactorCodeForm", () => {
  it("asks for the code before calling the server", async () => {
    const { user, api, onVerified } = renderCodeForm({});

    await user.click(await screen.findByRole("button", { name: text.submit }));

    expect(await screen.findByText(text.required)).toBeVisible();
    expect(api.requestsTo(TOTP_ROUTE)).toHaveLength(0);
    expect(api.requestsTo(BACKUP_ROUTE)).toHaveLength(0);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("verifies the code of the authenticator app and continues", async () => {
    const verify = heldReply(jsonReply({ token: "session" }));
    const { user, api, onVerified } = renderCodeForm({ [TOTP_ROUTE]: verify.reply });

    expect(await screen.findByText(text.adminSubtitle)).toBeVisible();
    await user.type(screen.getByLabelText(text.label), "654321");
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByRole("button", { name: text.submitting })).toBeDisabled();
    verify.release();

    await waitFor(() => expect(onVerified).toHaveBeenCalledTimes(1));
    expect(api.requestsTo(TOTP_ROUTE)[0]?.body).toEqual({ code: "654321" });
  });

  it("shows a wrong code under the field without continuing", async () => {
    const { user, onVerified } = renderCodeForm({ [TOTP_ROUTE]: authError("INVALID_CODE", 401) });

    await user.type(await screen.findByLabelText(text.label), "000000");
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.invalid_two_factor_code)).toBeVisible();
    expect(screen.getByRole("button", { name: text.submit })).toBeEnabled();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("shows too many attempts in a toast with the short trace id", async () => {
    const { user, onVerified } = renderCodeForm({ [TOTP_ROUTE]: authError("TOO_MANY", 429) });

    await user.type(await screen.findByLabelText(text.label), "111111");
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.rate_limited)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("switches to a backup code and verifies it", async () => {
    const { user, api, onVerified } = renderCodeForm({
      [BACKUP_ROUTE]: jsonReply({ token: "session" }),
    });

    await user.click(await screen.findByRole("button", { name: text.switchToBackup }));

    const backupField = await screen.findByLabelText(text.backupLabel);
    expect(screen.getByText(text.backupHint)).toBeVisible();
    await user.type(backupField, "AAAA-1111");
    await user.click(screen.getByRole("button", { name: text.submit }));

    await waitFor(() => expect(onVerified).toHaveBeenCalledTimes(1));
    expect(api.requestsTo(BACKUP_ROUTE)[0]?.body).toEqual({ code: "AAAA-1111" });
    expect(api.requestsTo(TOTP_ROUTE)).toHaveLength(0);
  });

  it("goes back to the authenticator app code from the backup code", async () => {
    const { user } = renderCodeForm({});

    await user.click(await screen.findByRole("button", { name: text.switchToBackup }));
    await user.click(await screen.findByRole("button", { name: text.switchToApp }));

    expect(await screen.findByLabelText(text.label)).toBeVisible();
    expect(screen.queryByLabelText(text.backupLabel)).toBeNull();
  });

  it("signs out to change account", async () => {
    const { user, api, router } = renderCodeForm({
      "POST /api/auth/sign-out": jsonReply({ success: true }),
    });

    await user.click(await screen.findByRole("button", { name: text.changeAccount }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/connexion"));
    expect(api.requestsTo("POST /api/auth/sign-out")).toHaveLength(1);
  });
});
