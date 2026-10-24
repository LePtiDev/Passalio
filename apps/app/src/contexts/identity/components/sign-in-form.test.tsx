import { screen, waitFor } from "@testing-library/react";
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
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { identityFr } from "../fr";
import { SignInForm } from "./sign-in-form";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = identityFr.signIn;
const fields = identityFr.fields;

const SIGN_IN_ROUTE = "POST /api/auth/sign-in/email";
const MAGIC_LINK_ROUTE = "POST /api/auth/sign-in/magic-link";

const signedInReply = jsonReply({ redirect: false, token: "session-token", user: null });

const renderSignIn = (returnTo = "/") =>
  renderScreen(<SignInForm returnTo={returnTo} />, { path: "/connexion" });

const fillCredentials = async (user: ReturnType<typeof renderSignIn>["user"]) => {
  await user.type(await screen.findByLabelText(fields.emailLabel), "paul@ramonage-dupont.fr");
  await user.type(screen.getByLabelText(fields.passwordLabel), "un mot de passe solide");
};

describe("SignInForm", () => {
  afterEach(forgetToasts);

  it("shows the French validation messages and sends nothing when the form is empty", async () => {
    installTurnstile();
    const api = installFakeApi({ ...signedOutRoutes(), [SIGN_IN_ROUTE]: signedInReply });
    const { user } = renderSignIn();

    await user.click(await screen.findByRole("button", { name: text.submit }));

    expect(await screen.findByText(fields.invalidEmail)).toBeVisible();
    expect(screen.getByText(fields.passwordRequired)).toBeVisible();
    expect(screen.getByLabelText(fields.emailLabel)).toHaveAttribute("aria-invalid", "true");
    expect(api.requestsTo(SIGN_IN_ROUTE)).toHaveLength(0);
  });

  it("signs in with the captcha token and opens the requested page", async () => {
    installTurnstile();
    const api = installFakeApi({ ...signedOutRoutes(), [SIGN_IN_ROUTE]: signedInReply });
    const { user, router } = renderSignIn("/clients");

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: text.submit }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/clients"));
    expect(api.requestsTo(SIGN_IN_ROUTE)[0]?.body).toEqual({
      email: "paul@ramonage-dupont.fr",
      password: "un mot de passe solide",
      rememberMe: true,
    });
    expect(headerSentTo(api, "/api/auth/sign-in/email", "x-captcha-response")).toBe(CAPTCHA_TOKEN);
  });

  it("shows a pending submit button while the server answers", async () => {
    installTurnstile();
    const signIn = heldReply(signedInReply);
    installFakeApi({ ...signedOutRoutes(), [SIGN_IN_ROUTE]: signIn.reply });
    const { user, router } = renderSignIn();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByRole("button", { name: text.submitting })).toBeDisabled();
    signIn.release();
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  it("shows a wrong password error with the short trace id and stays on the form", async () => {
    installTurnstile();
    installFakeApi({
      ...signedOutRoutes(),
      [SIGN_IN_ROUTE]: authErrorReply("INVALID_EMAIL_OR_PASSWORD", 401),
    });
    const { user, router } = renderSignIn("/clients");

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.invalid_credentials)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.queryByText(new RegExp(TRACE_ID))).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/connexion");
    expect(screen.getByRole("button", { name: text.submit })).toBeEnabled();
  });

  it("tells the user to wait after too many attempts", async () => {
    installTurnstile();
    installFakeApi({ ...signedOutRoutes(), [SIGN_IN_ROUTE]: authErrorReply("TOO_MANY", 429) });
    const { user } = renderSignIn();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.rate_limited)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
  });

  it("refuses to send the credentials when the anti-robot check fails", async () => {
    const turnstile = installTurnstile({ isPassing: false });
    const api = installFakeApi({ ...signedOutRoutes(), [SIGN_IN_ROUTE]: signedInReply });
    const { user } = renderSignIn();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: text.submit }));
    expect(await screen.findByRole("button", { name: text.submitting })).toBeDisabled();
    turnstile.failChallenge();

    expect(await screen.findByText(fr.errors.messages.captcha_failed)).toBeVisible();
    expect(await screen.findByRole("button", { name: text.submit })).toBeEnabled();
    expect(api.requestsTo(SIGN_IN_ROUTE)).toHaveLength(0);
  });

  it("asks for the two-factor code when the account requires it", async () => {
    installTurnstile();
    installFakeApi({
      ...signedOutRoutes(),
      [SIGN_IN_ROUTE]: jsonReply({ twoFactorRedirect: true }),
    });
    const { user, router } = renderSignIn("/admin");

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: text.submit }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/connexion/code"));
    expect(router.state.location.search).toEqual({ retour: "/admin" });
  });

  it("asks for a valid email before sending a sign-in link", async () => {
    installTurnstile();
    const api = installFakeApi({ ...signedOutRoutes(), [MAGIC_LINK_ROUTE]: jsonReply({}) });
    const { user } = renderSignIn();

    await user.click(await screen.findByRole("button", { name: text.magicLink }));

    expect(await screen.findByText(fields.invalidEmail)).toBeVisible();
    expect(screen.queryByText(fields.passwordRequired)).not.toBeInTheDocument();
    expect(api.requestsTo(MAGIC_LINK_ROUTE)).toHaveLength(0);
  });

  it("sends a sign-in link and lets the user change the address", async () => {
    installTurnstile();
    const api = installFakeApi({
      ...signedOutRoutes(),
      [MAGIC_LINK_ROUTE]: jsonReply({ status: true }),
    });
    const { user } = renderSignIn("/clients");

    await user.type(await screen.findByLabelText(fields.emailLabel), "paul@ramonage-dupont.fr");
    await user.click(screen.getByRole("button", { name: text.magicLink }));

    expect(await screen.findByRole("heading", { name: text.checkInboxTitle })).toBeVisible();
    expect(screen.getByText("paul@ramonage-dupont.fr")).toBeVisible();
    expect(screen.getByRole("button", { name: text.resendIn("1:00") })).toBeDisabled();
    expect(api.requestsTo(MAGIC_LINK_ROUTE)[0]?.body).toEqual({
      email: "paul@ramonage-dupont.fr",
      callbackURL: `${window.location.origin}/clients`,
    });

    await user.click(screen.getByRole("button", { name: text.otherEmail }));

    expect(await screen.findByRole("heading", { name: text.title })).toBeVisible();
  });

  it("shows the error with the short trace id when the sign-in link cannot be sent", async () => {
    installTurnstile();
    installFakeApi({ ...signedOutRoutes(), [MAGIC_LINK_ROUTE]: authErrorReply("FAILED", 500) });
    const { user } = renderSignIn();

    await user.type(await screen.findByLabelText(fields.emailLabel), "paul@ramonage-dupont.fr");
    await user.click(screen.getByRole("button", { name: text.magicLink }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.queryByRole("heading", { name: text.checkInboxTitle })).not.toBeInTheDocument();
  });

  it("links to the forgotten password page and to sign-up with the return path", async () => {
    installTurnstile();
    installFakeApi(signedOutRoutes());
    renderSignIn("/clients");

    expect(await screen.findByRole("link", { name: text.forgotPassword })).toHaveAttribute(
      "href",
      "/mot-de-passe-oublie",
    );
    expect(screen.getByRole("link", { name: text.createAccount })).toHaveAttribute(
      "href",
      "/inscription?retour=%2Fclients",
    );
  });
});

describe("SignInForm feedback", () => {
  afterEach(forgetToasts);

  it("links each validation message to its field for screen readers", async () => {
    installTurnstile();
    installFakeApi(signedOutRoutes());
    const { user } = renderSignIn();

    await user.click(await screen.findByRole("button", { name: text.submit }));

    expect(await screen.findByLabelText(fields.emailLabel)).toHaveAccessibleDescription(
      fields.invalidEmail,
    );
    expect(screen.getByLabelText(fields.passwordLabel)).toHaveAccessibleDescription(
      fields.passwordRequired,
    );
    expect(screen.getByLabelText(fields.passwordLabel)).toHaveAttribute("aria-invalid", "true");
  });

  it("disables the sign-in link button while the link is being sent", async () => {
    installTurnstile();
    const magicLink = heldReply(jsonReply({ status: true }));
    const api = installFakeApi({ ...signedOutRoutes(), [MAGIC_LINK_ROUTE]: magicLink.reply });
    const { user } = renderSignIn();

    await user.type(await screen.findByLabelText(fields.emailLabel), "paul@ramonage-dupont.fr");
    const button = screen.getByRole("button", { name: text.magicLink });
    await user.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    await user.click(button);
    magicLink.release();

    expect(await screen.findByRole("heading", { name: text.checkInboxTitle })).toBeVisible();
    expect(api.requestsTo(MAGIC_LINK_ROUTE)).toHaveLength(1);
  });

  it("keeps the typed address and re-enables the link button after a failed sign-in link", async () => {
    installTurnstile();
    installFakeApi({ ...signedOutRoutes(), [MAGIC_LINK_ROUTE]: authErrorReply("FAILED", 500) });
    const { user } = renderSignIn();

    await user.type(await screen.findByLabelText(fields.emailLabel), "paul@ramonage-dupont.fr");
    await user.click(screen.getByRole("button", { name: text.magicLink }));

    expect(await screen.findByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.getByLabelText(fields.emailLabel)).toHaveValue("paul@ramonage-dupont.fr");
    await waitFor(() => expect(screen.getByRole("button", { name: text.magicLink })).toBeEnabled());
  });

  it("keeps the typed address after a wrong password", async () => {
    installTurnstile();
    installFakeApi({
      ...signedOutRoutes(),
      [SIGN_IN_ROUTE]: authErrorReply("INVALID_EMAIL_OR_PASSWORD", 401),
    });
    const { user } = renderSignIn();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.invalid_credentials)).toBeVisible();
    expect(screen.getByLabelText(fields.emailLabel)).toHaveValue("paul@ramonage-dupont.fr");
    expect(screen.queryByText(TRACE_ID)).not.toBeInTheDocument();
  });
});
