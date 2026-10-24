import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import {
  authErrorReply,
  CAPTCHA_TOKEN,
  forgetToasts,
  headerSentTo,
  installTurnstile,
  SHORT_TRACE_ID,
  signedOutRoutes,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { identityFr } from "../fr";
import { ForgotPasswordForm } from "./forgot-password-form";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = identityFr.forgotPassword;

const RESET_REQUEST_ROUTE = "POST /api/auth/request-password-reset";

const renderForgotPassword = () =>
  renderScreen(<ForgotPasswordForm />, { path: "/mot-de-passe-oublie" });

describe("ForgotPasswordForm", () => {
  afterEach(forgetToasts);

  it("asks for a valid email before sending anything", async () => {
    installTurnstile();
    const api = installFakeApi({ ...signedOutRoutes(), [RESET_REQUEST_ROUTE]: jsonReply({}) });
    const { user } = renderForgotPassword();

    await user.type(await screen.findByLabelText(identityFr.fields.emailLabel), "paul@");
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(identityFr.fields.invalidEmail)).toBeVisible();
    expect(api.requestsTo(RESET_REQUEST_ROUTE)).toHaveLength(0);
  });

  it("sends the reset link to the new password page and confirms without revealing the account", async () => {
    installTurnstile();
    const request = heldReply(jsonReply({ status: true }));
    const api = installFakeApi({ ...signedOutRoutes(), [RESET_REQUEST_ROUTE]: request.reply });
    const { user } = renderForgotPassword();

    await user.type(
      await screen.findByLabelText(identityFr.fields.emailLabel),
      "paul@ramonage-dupont.fr",
    );
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByRole("button", { name: text.submitting })).toBeDisabled();
    request.release();

    expect(await screen.findByRole("heading", { name: text.sentTitle })).toBeVisible();
    expect(screen.getByText(text.sent)).toBeVisible();
    expect(screen.getByRole("link", { name: text.backToSignIn })).toHaveAttribute(
      "href",
      "/connexion",
    );
    expect(api.requestsTo(RESET_REQUEST_ROUTE)[0]?.body).toEqual({
      email: "paul@ramonage-dupont.fr",
      redirectTo: `${window.location.origin}/mot-de-passe/nouveau`,
    });
    expect(headerSentTo(api, "/api/auth/request-password-reset", "x-captcha-response")).toBe(
      CAPTCHA_TOKEN,
    );
  });

  it("shows the error with the short trace id and keeps the form", async () => {
    installTurnstile();
    installFakeApi({
      ...signedOutRoutes(),
      [RESET_REQUEST_ROUTE]: authErrorReply("TOO_MANY_REQUESTS", 429),
    });
    const { user } = renderForgotPassword();

    await user.type(
      await screen.findByLabelText(identityFr.fields.emailLabel),
      "paul@ramonage-dupont.fr",
    );
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.rate_limited)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.getByRole("heading", { name: text.title })).toBeVisible();
    expect(screen.queryByRole("heading", { name: text.sentTitle })).not.toBeInTheDocument();
  });

  it("offers a way back to sign-in", async () => {
    installTurnstile();
    installFakeApi(signedOutRoutes());
    const { user, router } = renderForgotPassword();

    await user.click(await screen.findByRole("link", { name: text.backToSignIn }));

    expect(router.state.location.pathname).toBe("/connexion");
  });
});
