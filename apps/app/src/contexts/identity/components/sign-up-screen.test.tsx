import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import {
  authErrorReply,
  forgetToasts,
  installTurnstile,
  SHORT_TRACE_ID,
  signedOutRoutes,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { identityFr } from "../fr";
import { isInvitationReturn, SignUpScreen } from "./sign-up-screen";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const AVAILABILITY_ROUTE = "GET /api/sign-up-availability";
const SIGN_UP_ROUTE = "POST /api/auth/sign-up/email";

const closedText = identityFr.signUpClosed;
const formText = identityFr.signUp;

const renderSignUpScreen = (returnTo?: string) =>
  renderScreen(<SignUpScreen returnTo={returnTo} />, { path: "/inscription" });

describe("SignUpScreen", () => {
  afterEach(forgetToasts);

  it("shows a skeleton of the form while it checks whether sign-up is open", async () => {
    installTurnstile();
    const reply = heldReply(jsonReply({ isSignUpOpen: true }));
    installFakeApi({ ...signedOutRoutes(), [AVAILABILITY_ROUTE]: reply.reply });

    renderSignUpScreen();

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: formText.submit })).not.toBeInTheDocument();

    reply.release();

    expect(await screen.findByRole("button", { name: formText.submit })).toBeVisible();
    expect(busyRegions()).toHaveLength(0);
  });

  it("shows the sign-up form while sign-up is open", async () => {
    installTurnstile();
    installFakeApi({
      ...signedOutRoutes(),
      [AVAILABILITY_ROUTE]: jsonReply({ isSignUpOpen: true }),
    });

    renderSignUpScreen();

    expect(await screen.findByRole("heading", { name: formText.title })).toBeVisible();
    expect(screen.queryByText(closedText.title)).not.toBeInTheDocument();
  });

  it("explains that sign-up is closed and leads to the sign-in page, keeping the return path", async () => {
    installFakeApi({
      ...signedOutRoutes(),
      [AVAILABILITY_ROUTE]: jsonReply({ isSignUpOpen: false }),
    });

    renderSignUpScreen("/clients");

    expect(await screen.findByRole("heading", { name: closedText.title })).toBeVisible();
    expect(screen.getByText(closedText.text)).toBeVisible();
    expect(screen.getByRole("link", { name: closedText.signIn })).toHaveAttribute(
      "href",
      "/connexion?retour=%2Fclients",
    );
    expect(screen.getByRole("link", { name: closedText.discover })).toHaveAttribute(
      "href",
      "https://passalio.com",
    );
    expect(screen.queryByRole("button", { name: formText.submit })).not.toBeInTheDocument();
  });

  it("shows the form to a person coming from an invitation, without asking whether sign-up is open", async () => {
    installTurnstile();
    const api = installFakeApi({
      ...signedOutRoutes(),
      [AVAILABILITY_ROUTE]: jsonReply({ isSignUpOpen: false }),
    });

    renderSignUpScreen("/invitations/organization-1/invitation-1");

    expect(await screen.findByRole("button", { name: formText.submit })).toBeVisible();
    expect(api.requestsTo(AVAILABILITY_ROUTE)).toHaveLength(0);
  });

  it("shows the form when the check fails, the server refusing the account if sign-up is closed", async () => {
    installTurnstile();
    installFakeApi({
      ...signedOutRoutes(),
      [AVAILABILITY_ROUTE]: errorReply("internal", "trace-availability"),
    });

    renderSignUpScreen();

    expect(await screen.findByRole("button", { name: formText.submit })).toBeVisible();
  });

  it("explains a refused account with the short trace id when sign-up closed meanwhile", async () => {
    installTurnstile();
    installFakeApi({
      ...signedOutRoutes(),
      [AVAILABILITY_ROUTE]: jsonReply({ isSignUpOpen: true }),
      [SIGN_UP_ROUTE]: authErrorReply("SIGN_UP_CLOSED", 403),
    });
    const { user } = renderSignUpScreen();

    await user.type(await screen.findByLabelText(formText.firstNameLabel), "Jeanne");
    await user.type(screen.getByLabelText(formText.lastNameLabel), "Martin");
    await user.type(
      screen.getByLabelText(identityFr.fields.workEmailLabel),
      "jeanne@ramonage-martin.fr",
    );
    await user.type(
      screen.getByLabelText(identityFr.fields.passwordLabel),
      "une phrase facile a retenir",
    );
    await user.click(screen.getByRole("checkbox", { name: /J'accepte les/ }));
    await user.click(screen.getByRole("button", { name: formText.submit }));

    expect(await screen.findByText(fr.errors.messages.sign_up_closed)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
  });
});

describe("isInvitationReturn", () => {
  it.each([
    ["/invitations/organization-1/invitation-1", true],
    ["/equipe-passalio/invitations/invitation-1", true],
    ["/clients", false],
    [undefined, false],
  ])("treats %s as an invitation: %s", (returnTo, isInvitation) => {
    expect(isInvitationReturn(returnTo)).toBe(isInvitation);
  });
});
