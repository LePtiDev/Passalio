import { TERMS_VERSION } from "@passalio/shared";
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { legalFr } from "@/legal";
import { closestOf } from "@/test-support/closest";
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
import { SignUpForm } from "./sign-up-form";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = identityFr.signUp;
const fields = identityFr.fields;

const SIGN_UP_ROUTE = "POST /api/auth/sign-up/email";

const signedUpReply = jsonReply({ token: "session-token", user: null });

const renderSignUp = (returnTo = "/") =>
  renderScreen(<SignUpForm returnTo={returnTo} />, { path: "/inscription" });

type User = ReturnType<typeof renderSignUp>["user"];

const fillForm = async (user: User) => {
  await user.type(await screen.findByLabelText(text.firstNameLabel), "Jeanne");
  await user.type(screen.getByLabelText(text.lastNameLabel), "Martin");
  await user.type(screen.getByLabelText(fields.workEmailLabel), "jeanne@ramonage-martin.fr");
  await user.type(screen.getByLabelText(fields.passwordLabel), "une phrase facile a retenir");
  await user.click(screen.getByRole("checkbox", { name: /J'accepte les/ }));
};

describe("SignUpForm", () => {
  afterEach(forgetToasts);

  it("shows every French validation message and sends nothing when the form is empty", async () => {
    installTurnstile();
    const api = installFakeApi({ ...signedOutRoutes(), [SIGN_UP_ROUTE]: signedUpReply });
    const { user } = renderSignUp();

    await user.click(await screen.findByRole("button", { name: text.submit }));

    expect(await screen.findAllByText(text.nameRequired)).toHaveLength(2);
    expect(screen.getByText(fields.invalidEmail)).toBeVisible();
    expect(screen.getByText(fields.passwordTooShort)).toBeVisible();
    expect(screen.getByText(text.termsRequired)).toBeVisible();
    expect(api.requestsTo(SIGN_UP_ROUTE)).toHaveLength(0);
  });

  it("refuses an account when the terms are not accepted", async () => {
    installTurnstile();
    const api = installFakeApi({ ...signedOutRoutes(), [SIGN_UP_ROUTE]: signedUpReply });
    const { user } = renderSignUp();

    await fillForm(user);
    await user.click(screen.getByRole("checkbox", { name: /J'accepte les/ }));
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(text.termsRequired)).toBeVisible();
    expect(api.requestsTo(SIGN_UP_ROUTE)).toHaveLength(0);
  });

  it("explains the password rule while the user types", async () => {
    installTurnstile();
    installFakeApi(signedOutRoutes());
    const { user } = renderSignUp();

    expect(await screen.findByText(fields.strengthHint)).toBeVisible();

    await user.type(screen.getByLabelText(fields.passwordLabel), "court");

    expect(
      await screen.findByText(`${fields.strength[1]} ${fields.passwordTooShort}`),
    ).toBeVisible();
  });

  it("creates the account with the terms version and the captcha token, then continues", async () => {
    installTurnstile();
    const api = installFakeApi({ ...signedOutRoutes(), [SIGN_UP_ROUTE]: signedUpReply });
    const { user, router } = renderSignUp("/invitations/organization-1/invitation-1");

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: text.submit }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/invitations/organization-1/invitation-1"),
    );
    expect(api.requestsTo(SIGN_UP_ROUTE)[0]?.body).toEqual({
      name: "Jeanne Martin",
      email: "jeanne@ramonage-martin.fr",
      password: "une phrase facile a retenir",
      termsVersion: TERMS_VERSION,
    });
    expect(headerSentTo(api, "/api/auth/sign-up/email", "x-captcha-response")).toBe(CAPTCHA_TOKEN);
  });

  it("shows a pending submit button while the account is created", async () => {
    installTurnstile();
    const signUp = heldReply(signedUpReply);
    installFakeApi({ ...signedOutRoutes(), [SIGN_UP_ROUTE]: signUp.reply });
    const { user, router } = renderSignUp();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByRole("button", { name: text.submitting })).toBeDisabled();
    signUp.release();
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  it("tells the user the address is already used, with the short trace id", async () => {
    const turnstile = installTurnstile();
    installFakeApi({
      ...signedOutRoutes(),
      [SIGN_UP_ROUTE]: authErrorReply("USER_ALREADY_EXISTS", 422),
    });
    const { user, router } = renderSignUp();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: text.submit }));

    expect(await screen.findByText(fr.errors.messages.email_already_used)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(router.state.location.pathname).toBe("/inscription");
    expect(turnstile.reset).toHaveBeenCalled();
  });

  it("opens the terms and the privacy policy in a new tab", async () => {
    installTurnstile();
    installFakeApi(signedOutRoutes());
    renderSignUp();

    const consent = within(
      closestOf(await screen.findByRole("checkbox", { name: /J'accepte les/ }), "label"),
    );
    const terms = consent.getByRole("link", {
      name: new RegExp(legalFr.acceptTerms.terms),
    });
    const privacy = consent.getByRole("link", {
      name: new RegExp(legalFr.acceptTerms.privacy),
    });
    expect(terms).toHaveAttribute("href", "/conditions");
    expect(terms).toHaveAttribute("target", "_blank");
    expect(privacy).toHaveAttribute("href", "/confidentialite");
    expect(privacy).toHaveAttribute("target", "_blank");
  });

  it("links to sign-in and keeps the return path", async () => {
    installTurnstile();
    installFakeApi(signedOutRoutes());
    renderSignUp("/clients");

    expect(await screen.findByRole("link", { name: text.signIn })).toHaveAttribute(
      "href",
      "/connexion?retour=%2Fclients",
    );
  });
});
