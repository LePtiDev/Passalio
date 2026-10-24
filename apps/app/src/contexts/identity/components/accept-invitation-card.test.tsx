import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import {
  forgetToasts,
  SET_ACTIVE_ORGANIZATION_ROUTE,
  SHORT_TRACE_ID,
  signedOutRoutes,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { identityFr } from "../fr";
import { AcceptInvitationCard } from "./accept-invitation-card";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = identityFr.invitation;

const ACCEPT_ROUTE = "POST /api/invitations/organization-2/invitation-9/accept";

const renderCard = () =>
  renderScreen(
    <AcceptInvitationCard organizationId="organization-2" invitationId="invitation-9" />,
    {
      path: "/invitations/organization-2/invitation-9",
    },
  );

describe("AcceptInvitationCard", () => {
  afterEach(forgetToasts);

  it("joins the company, switches to it, confirms with a toast and opens the team", async () => {
    const accept = heldReply(jsonReply({ memberId: "member-9" }));
    const api = installFakeApi({
      ...signedOutRoutes(),
      [ACCEPT_ROUTE]: accept.reply,
      [SET_ACTIVE_ORGANIZATION_ROUTE]: jsonReply({ id: "organization-2" }),
    });
    const { user, router } = renderCard();

    expect(await screen.findByRole("heading", { name: text.title })).toBeVisible();
    expect(screen.getByText(text.text)).toBeVisible();
    await user.click(screen.getByRole("button", { name: text.accept }));

    expect(await screen.findByRole("button", { name: text.accepting })).toBeDisabled();
    accept.release();

    expect(await screen.findByText(text.accepted)).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe("/equipe"));
    expect(api.requestsTo(SET_ACTIVE_ORGANIZATION_ROUTE)[0]?.body).toEqual({
      organizationId: "organization-2",
    });
  });

  it("shows an expired invitation with the short trace id and stays on the page", async () => {
    installFakeApi({
      ...signedOutRoutes(),
      [ACCEPT_ROUTE]: errorReply("invitation_expired", TRACE_ID, 410),
    });
    const { user, router } = renderCard();

    await user.click(await screen.findByRole("button", { name: text.accept }));

    expect(await screen.findByText(fr.errors.messages.invitation_expired)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.getByRole("button", { name: text.accept })).toBeEnabled();
    expect(router.state.location.pathname).toBe("/invitations/organization-2/invitation-9");
  });

  it("explains that the invitation was sent to another address", async () => {
    const api = installFakeApi({
      ...signedOutRoutes(),
      [ACCEPT_ROUTE]: errorReply("invitation_email_mismatch", TRACE_ID, 403),
    });
    const { user } = renderCard();

    await user.click(await screen.findByRole("button", { name: text.accept }));

    expect(await screen.findByText(fr.errors.messages.invitation_email_mismatch)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(api.requestsTo(SET_ACTIVE_ORGANIZATION_ROUTE)).toHaveLength(0);
  });
});

describe("AcceptInvitationCard repeated clicks", () => {
  afterEach(forgetToasts);

  it("accepts the invitation only once when the button is clicked twice", async () => {
    const accept = heldReply(jsonReply({ memberId: "member-9" }));
    const api = installFakeApi({
      ...signedOutRoutes(),
      [ACCEPT_ROUTE]: accept.reply,
      [SET_ACTIVE_ORGANIZATION_ROUTE]: jsonReply({ id: "organization-2" }),
    });
    const { user, router } = renderCard();

    await user.click(await screen.findByRole("button", { name: text.accept }));
    await user.click(await screen.findByRole("button", { name: text.accepting }));
    accept.release();

    await waitFor(() => expect(router.state.location.pathname).toBe("/equipe"));
    expect(api.requestsTo(ACCEPT_ROUTE)).toHaveLength(1);
  });
});
