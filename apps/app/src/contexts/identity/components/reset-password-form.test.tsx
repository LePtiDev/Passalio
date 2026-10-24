import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import {
  authErrorReply,
  forgetToasts,
  SHORT_TRACE_ID,
  signedOutRoutes,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { identityFr } from "../fr";
import { ResetPasswordForm } from "./reset-password-form";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = identityFr.resetPassword;

const RESET_ROUTE = "POST /api/auth/reset-password";

const renderReset = (token: string | null) =>
  renderScreen(<ResetPasswordForm token={token} />, { path: "/mot-de-passe/nouveau" });

describe("ResetPasswordForm", () => {
  afterEach(forgetToasts);

  it("explains that a link without token has expired and offers a new one", async () => {
    installFakeApi(signedOutRoutes());
    const { user, router } = renderReset(null);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(text.invalidLinkTitle);
    expect(alert).toHaveTextContent(text.invalidLink);

    await user.click(screen.getByRole("link", { name: text.requestNewLink }));

    expect(router.state.location.pathname).toBe("/mot-de-passe-oublie");
  });

  it("refuses a password shorter than 12 characters", async () => {
    const api = installFakeApi({ ...signedOutRoutes(), [RESET_ROUTE]: jsonReply({}) });
    const { user } = renderReset("reset-token");

    await user.type(await screen.findByLabelText(text.newPasswordLabel), "trop court");
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(identityFr.fields.passwordTooShort)).toBeVisible();
    expect(screen.getByLabelText(text.newPasswordLabel)).toHaveAttribute("aria-invalid", "true");
    expect(api.requestsTo(RESET_ROUTE)).toHaveLength(0);
  });

  it("saves the new password, confirms with a toast and opens sign-in", async () => {
    const reset = heldReply(jsonReply({ status: true }));
    const api = installFakeApi({ ...signedOutRoutes(), [RESET_ROUTE]: reset.reply });
    const { user, router } = renderReset("reset-token");

    await user.type(
      await screen.findByLabelText(text.newPasswordLabel),
      "une phrase facile a retenir",
    );
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByRole("button", { name: text.submitting })).toBeDisabled();
    reset.release();

    expect(await screen.findByText(text.done)).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe("/connexion"));
    expect(api.requestsTo(RESET_ROUTE)[0]?.body).toEqual({
      newPassword: "une phrase facile a retenir",
      token: "reset-token",
    });
  });

  it("shows the expired link screen when the server rejects the token", async () => {
    installFakeApi({ ...signedOutRoutes(), [RESET_ROUTE]: authErrorReply("INVALID_TOKEN", 400) });
    const { user } = renderReset("used-token");

    await user.type(
      await screen.findByLabelText(text.newPasswordLabel),
      "une phrase facile a retenir",
    );
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(text.invalidLink);
    expect(screen.getByRole("link", { name: text.requestNewLink })).toBeVisible();
  });

  it("shows other errors with the short trace id and keeps the form", async () => {
    installFakeApi({ ...signedOutRoutes(), [RESET_ROUTE]: authErrorReply("UNKNOWN", 500) });
    const { user, router } = renderReset("reset-token");

    await user.type(
      await screen.findByLabelText(text.newPasswordLabel),
      "une phrase facile a retenir",
    );
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.getByRole("heading", { name: text.title })).toBeVisible();
    expect(router.state.location.pathname).toBe("/mot-de-passe/nouveau");
  });
});
