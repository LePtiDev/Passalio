import { screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { installFakeApi, jsonReply } from "@/test-support/fake-api";
import { routeWindowFetchToFakeApi } from "@/test-support/happy-dom-window";
import { renderScreen } from "@/test-support/render-screen";
import { twoFactorFr } from "../../two-factor-fr";
import { TwoFactorCodeForm } from "./two-factor-code-form";
import { TwoFactorSetup } from "./two-factor-setup";

const TOTP_ROUTE = "POST /api/auth/two-factor/verify-totp";
const BACKUP_ROUTE = "POST /api/auth/two-factor/verify-backup-code";
const ENABLE_ROUTE = "POST /api/auth/two-factor/enable";

const TRACE_ID = "f0e1d2c3-b4a5-4697-8879-6a5b4c3d2e1f";

const ENROLLMENT = {
  totpURI: "otpauth://totp/Passalio:nina@passalio.test?secret=JBSWY3DPEHPK3PXP&issuer=Passalio",
  backupCodes: ["DDDD-4444", "EEEE-5555"],
};

const authError = (code: string, status: number) =>
  jsonReply({ code, message: code, traceId: TRACE_ID }, status);

const renderCodeForm = (routes: Parameters<typeof installFakeApi>[0]) => {
  const api = installFakeApi(routes);
  routeWindowFetchToFakeApi(api);
  const onVerified = vi.fn<() => Promise<void>>(async () => undefined);
  const rendered = renderScreen(
    <TwoFactorCodeForm subtitle={twoFactorFr.code.adminSubtitle} onVerified={onVerified} />,
    { path: "/admin/code" },
  );
  return { ...rendered, api, onVerified };
};

const renderSetup = (routes: Parameters<typeof installFakeApi>[0]) => {
  const api = installFakeApi(routes);
  routeWindowFetchToFakeApi(api);
  const onDone = vi.fn<() => void>();
  const rendered = renderScreen(<TwoFactorSetup onDone={onDone} />, { path: "/admin/securite" });
  return { ...rendered, api, onDone };
};

describe("Two-factor error feedback", () => {
  afterEach(() => {
    toast.dismiss();
  });

  it("marks the code field as invalid and links it to the error message", async () => {
    const { user } = renderCodeForm({ [TOTP_ROUTE]: authError("INVALID_CODE", 401) });

    await user.type(await screen.findByLabelText(twoFactorFr.code.label), "000000");
    await user.click(screen.getByRole("button", { name: twoFactorFr.code.submit }));

    expect(await screen.findByText(fr.errors.messages.invalid_two_factor_code)).toBeVisible();
    const field = screen.getByLabelText(twoFactorFr.code.label);
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription(fr.errors.messages.invalid_two_factor_code);
  });

  it("shows a wrong backup code under the field without continuing", async () => {
    const { user, onVerified } = renderCodeForm({
      [BACKUP_ROUTE]: authError("INVALID_BACKUP_CODE", 401),
    });

    await user.click(await screen.findByRole("button", { name: twoFactorFr.code.switchToBackup }));
    await user.type(await screen.findByLabelText(twoFactorFr.code.backupLabel), "ZZZZ-0000");
    await user.click(screen.getByRole("button", { name: twoFactorFr.code.submit }));

    expect(await screen.findByText(fr.errors.messages.invalid_two_factor_code)).toBeVisible();
    expect(screen.getByLabelText(twoFactorFr.code.backupLabel)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("button", { name: twoFactorFr.code.submit })).toBeEnabled();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("clears the error when switching between the app code and a backup code", async () => {
    const { user } = renderCodeForm({ [TOTP_ROUTE]: authError("INVALID_CODE", 401) });

    await user.type(await screen.findByLabelText(twoFactorFr.code.label), "000000");
    await user.click(screen.getByRole("button", { name: twoFactorFr.code.submit }));
    expect(await screen.findByText(fr.errors.messages.invalid_two_factor_code)).toBeVisible();

    await user.click(screen.getByRole("button", { name: twoFactorFr.code.switchToBackup }));

    expect(await screen.findByLabelText(twoFactorFr.code.backupLabel)).toHaveValue("");
    expect(screen.queryByText(fr.errors.messages.invalid_two_factor_code)).toBeNull();
  });

  it("shows an unexpected error of the code check in a toast with the short trace id", async () => {
    const { user, onVerified } = renderCodeForm({ [TOTP_ROUTE]: authError("INTERNAL", 500) });

    await user.type(await screen.findByLabelText(twoFactorFr.code.label), "222222");
    await user.click(screen.getByRole("button", { name: twoFactorFr.code.submit }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    expect(screen.getByRole("button", { name: twoFactorFr.code.submit })).toBeEnabled();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("keeps the scan step and shows the short trace id when the activation fails unexpectedly", async () => {
    const { user, onDone } = renderSetup({
      [ENABLE_ROUTE]: jsonReply(ENROLLMENT),
      [TOTP_ROUTE]: authError("INTERNAL", 500),
    });

    await user.type(
      await screen.findByLabelText(twoFactorFr.setup.passwordLabel),
      "mot-de-passe-solide",
    );
    await user.click(screen.getByRole("button", { name: twoFactorFr.setup.continue }));
    await user.type(await screen.findByLabelText(twoFactorFr.setup.codeLabel), "333333");
    await user.click(screen.getByRole("button", { name: twoFactorFr.setup.activate }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: twoFactorFr.setup.activate })).toBeEnabled(),
    );
    expect(screen.getByText(twoFactorFr.setup.scanTitle)).toBeVisible();
    expect(
      screen.queryByRole("list", { name: twoFactorFr.backupCodes.listLabel }),
    ).not.toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("marks the activation code field as invalid when the code is wrong", async () => {
    const { user } = renderSetup({
      [ENABLE_ROUTE]: jsonReply(ENROLLMENT),
      [TOTP_ROUTE]: authError("INVALID_CODE", 401),
    });

    await user.type(
      await screen.findByLabelText(twoFactorFr.setup.passwordLabel),
      "mot-de-passe-solide",
    );
    await user.click(screen.getByRole("button", { name: twoFactorFr.setup.continue }));
    await user.type(await screen.findByLabelText(twoFactorFr.setup.codeLabel), "444444");
    await user.click(screen.getByRole("button", { name: twoFactorFr.setup.activate }));

    expect(await screen.findByText(fr.errors.messages.invalid_two_factor_code)).toBeVisible();
    const field = screen.getByLabelText(twoFactorFr.setup.codeLabel);
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription(fr.errors.messages.invalid_two_factor_code);
  });
});
