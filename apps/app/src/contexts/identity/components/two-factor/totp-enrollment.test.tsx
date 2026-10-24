import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { heldReply, installFakeApi, jsonReply, type FakeRoutes } from "@/test-support/fake-api";
import {
  authErrorReply,
  forgetToasts,
  SHORT_TRACE_ID,
  signedOutRoutes,
  TRACE_ID,
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

const enabledReply = jsonReply({
  totpURI: "otpauth://totp/Passalio:paul?secret=JBSWY3DPEHPK3PXP&issuer=Passalio",
  backupCodes: ["AAAA-1111", "BBBB-2222"],
});

const renderSetup = (routes: FakeRoutes) => {
  const api = installFakeApi({ ...signedOutRoutes(), ...routes });
  const onDone = vi.fn<() => void>();
  return {
    ...renderScreen(<TwoFactorSetup onDone={onDone} />, { path: "/admin/securite" }),
    api,
    onDone,
  };
};

type User = ReturnType<typeof renderSetup>["user"];

const confirmPassword = async (user: User) => {
  await user.type(await screen.findByLabelText(text.passwordLabel), "un mot de passe solide");
  await user.click(screen.getByRole("button", { name: text.continue }));
};

describe("TwoFactorSetup pending and error states", () => {
  afterEach(forgetToasts);

  it("blocks a second password check while the first one is pending", async () => {
    const enable = heldReply(enabledReply);
    const { user, api } = renderSetup({ [ENABLE_ROUTE]: enable.reply });

    await confirmPassword(user);

    const button = screen.getByRole("button", { name: text.continue });
    await waitFor(() => expect(button).toBeDisabled());
    await user.click(button);
    enable.release();

    expect(await screen.findByText(text.scanTitle)).toBeVisible();
    expect(api.requestsTo(ENABLE_ROUTE)).toHaveLength(1);
  });

  it("shows a pending activation button while the code is checked", async () => {
    const verify = heldReply(jsonReply({ token: "session-token" }));
    const { user, api } = renderSetup({
      [ENABLE_ROUTE]: enabledReply,
      [VERIFY_TOTP_ROUTE]: verify.reply,
    });

    await confirmPassword(user);
    await user.type(await screen.findByLabelText(text.codeLabel), "123456");
    await user.click(screen.getByRole("button", { name: text.activate }));

    expect(await screen.findByRole("button", { name: text.activating })).toBeDisabled();
    verify.release();

    expect(
      await screen.findByRole("list", { name: twoFactorFr.backupCodes.listLabel }),
    ).toBeVisible();
    expect(api.requestsTo(VERIFY_TOTP_ROUTE)).toHaveLength(1);
  });

  it("shows an unexpected activation failure with the short trace id and stays on the code step", async () => {
    const { user, onDone } = renderSetup({
      [ENABLE_ROUTE]: enabledReply,
      [VERIFY_TOTP_ROUTE]: authErrorReply("FAILED", 500),
    });

    await confirmPassword(user);
    await user.type(await screen.findByLabelText(text.codeLabel), "123456");
    await user.click(screen.getByRole("button", { name: text.activate }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.queryByText(TRACE_ID)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: text.activate })).toBeEnabled();
    expect(screen.queryByRole("list", { name: twoFactorFr.backupCodes.listLabel })).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("links a wrong password message to the field for screen readers", async () => {
    const { user } = renderSetup({ [ENABLE_ROUTE]: authErrorReply("INVALID_PASSWORD", 400) });

    await confirmPassword(user);

    expect(await screen.findByText(fr.errors.messages.invalid_password)).toBeVisible();
    expect(screen.getByLabelText(text.passwordLabel)).toHaveAccessibleDescription(
      fr.errors.messages.invalid_password,
    );
  });
});
