import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { captchaTokensSentTo, renewTokenOnReset } from "@/test-support/captcha-tokens";
import { installFakeApi, jsonReply } from "@/test-support/fake-api";
import {
  authErrorReply,
  CAPTCHA_TOKEN,
  forgetToasts,
  installTurnstile,
  signedOutRoutes,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { identityFr } from "../fr";
import { ForgotPasswordForm } from "./forgot-password-form";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const fields = identityFr.fields;

const FRESH_TOKEN = "turnstile-token-renewed";

const SIGN_IN_PATH = "/api/auth/sign-in/email";
const SIGN_UP_PATH = "/api/auth/sign-up/email";
const RESET_REQUEST_PATH = "/api/auth/request-password-reset";

describe("anti-robot check on the public forms", () => {
  afterEach(forgetToasts);

  it("sends a fresh anti-robot token when the user retries a refused sign-in", async () => {
    const turnstile = installTurnstile();
    renewTokenOnReset(turnstile, FRESH_TOKEN);
    const api = installFakeApi({
      ...signedOutRoutes(),
      [`POST ${SIGN_IN_PATH}`]: authErrorReply("INVALID_EMAIL_OR_PASSWORD", 401),
    });
    const { user } = renderScreen(<SignInForm returnTo="/" />, { path: "/connexion" });

    await user.type(await screen.findByLabelText(fields.emailLabel), "paul@ramonage-dupont.fr");
    await user.type(screen.getByLabelText(fields.passwordLabel), "un mot de passe solide");
    await user.click(screen.getByRole("button", { name: identityFr.signIn.submit }));
    expect(await screen.findByText(fr.errors.messages.invalid_credentials)).toBeVisible();

    await user.click(await screen.findByRole("button", { name: identityFr.signIn.submit }));

    await waitFor(() => expect(captchaTokensSentTo(api, SIGN_IN_PATH)).toHaveLength(2));
    expect(captchaTokensSentTo(api, SIGN_IN_PATH)).toEqual([CAPTCHA_TOKEN, FRESH_TOKEN]);
  });

  it("refuses to create an account when the anti-robot check fails", async () => {
    const turnstile = installTurnstile({ isPassing: false });
    const api = installFakeApi({
      ...signedOutRoutes(),
      [`POST ${SIGN_UP_PATH}`]: jsonReply({ token: "session-token", user: null }),
    });
    const { user, router } = renderScreen(<SignUpForm returnTo="/" />, { path: "/inscription" });

    await user.type(await screen.findByLabelText(identityFr.signUp.firstNameLabel), "Jeanne");
    await user.type(screen.getByLabelText(identityFr.signUp.lastNameLabel), "Martin");
    await user.type(screen.getByLabelText(fields.workEmailLabel), "jeanne@ramonage-martin.fr");
    await user.type(screen.getByLabelText(fields.passwordLabel), "une phrase facile a retenir");
    await user.click(screen.getByRole("checkbox", { name: /J'accepte les/ }));
    await user.click(screen.getByRole("button", { name: identityFr.signUp.submit }));
    expect(
      await screen.findByRole("button", { name: identityFr.signUp.submitting }),
    ).toBeDisabled();
    turnstile.failChallenge();

    expect(await screen.findByText(fr.errors.messages.captcha_failed)).toBeVisible();
    expect(await screen.findByRole("button", { name: identityFr.signUp.submit })).toBeEnabled();
    expect(api.requestsTo(`POST ${SIGN_UP_PATH}`)).toHaveLength(0);
    expect(router.state.location.pathname).toBe("/inscription");
  });

  it("sends a fresh anti-robot token when the user retries a refused account creation", async () => {
    const turnstile = installTurnstile();
    renewTokenOnReset(turnstile, FRESH_TOKEN);
    const api = installFakeApi({
      ...signedOutRoutes(),
      [`POST ${SIGN_UP_PATH}`]: authErrorReply("USER_ALREADY_EXISTS", 422),
    });
    const { user } = renderScreen(<SignUpForm returnTo="/" />, { path: "/inscription" });

    await user.type(await screen.findByLabelText(identityFr.signUp.firstNameLabel), "Jeanne");
    await user.type(screen.getByLabelText(identityFr.signUp.lastNameLabel), "Martin");
    await user.type(screen.getByLabelText(fields.workEmailLabel), "jeanne@ramonage-martin.fr");
    await user.type(screen.getByLabelText(fields.passwordLabel), "une phrase facile a retenir");
    await user.click(screen.getByRole("checkbox", { name: /J'accepte les/ }));
    await user.click(screen.getByRole("button", { name: identityFr.signUp.submit }));
    expect(await screen.findByText(fr.errors.messages.email_already_used)).toBeVisible();

    await user.click(await screen.findByRole("button", { name: identityFr.signUp.submit }));

    await waitFor(() => expect(captchaTokensSentTo(api, SIGN_UP_PATH)).toHaveLength(2));
    expect(captchaTokensSentTo(api, SIGN_UP_PATH)).toEqual([CAPTCHA_TOKEN, FRESH_TOKEN]);
  });

  it("refuses to send a reset link when the anti-robot check fails", async () => {
    const turnstile = installTurnstile({ isPassing: false });
    const api = installFakeApi({
      ...signedOutRoutes(),
      [`POST ${RESET_REQUEST_PATH}`]: jsonReply({ status: true }),
    });
    const { user } = renderScreen(<ForgotPasswordForm />, { path: "/mot-de-passe-oublie" });

    await user.type(await screen.findByLabelText(fields.emailLabel), "paul@ramonage-dupont.fr");
    await user.click(screen.getByRole("button", { name: identityFr.forgotPassword.submit }));
    expect(
      await screen.findByRole("button", { name: identityFr.forgotPassword.submitting }),
    ).toBeDisabled();
    turnstile.failChallenge();

    expect(await screen.findByText(fr.errors.messages.captcha_failed)).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: identityFr.forgotPassword.sentTitle }),
    ).not.toBeInTheDocument();
    expect(api.requestsTo(`POST ${RESET_REQUEST_PATH}`)).toHaveLength(0);
  });

  it("sends a fresh anti-robot token when the user asks again for a reset link", async () => {
    const turnstile = installTurnstile();
    renewTokenOnReset(turnstile, FRESH_TOKEN);
    const api = installFakeApi({
      ...signedOutRoutes(),
      [`POST ${RESET_REQUEST_PATH}`]: authErrorReply("TOO_MANY_REQUESTS", 429),
    });
    const { user } = renderScreen(<ForgotPasswordForm />, { path: "/mot-de-passe-oublie" });

    await user.type(await screen.findByLabelText(fields.emailLabel), "paul@ramonage-dupont.fr");
    await user.click(screen.getByRole("button", { name: identityFr.forgotPassword.submit }));
    expect(await screen.findByText(fr.errors.messages.rate_limited)).toBeVisible();

    await user.click(await screen.findByRole("button", { name: identityFr.forgotPassword.submit }));

    await waitFor(() => expect(captchaTokensSentTo(api, RESET_REQUEST_PATH)).toHaveLength(2));
    expect(captchaTokensSentTo(api, RESET_REQUEST_PATH)).toEqual([CAPTCHA_TOKEN, FRESH_TOKEN]);
  });
});
