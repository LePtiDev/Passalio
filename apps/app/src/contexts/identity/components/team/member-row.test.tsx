import type { OrganizationRole } from "@passalio/shared";
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { closestOf } from "@/test-support/closest";
import {
  errorReply,
  heldReply,
  installFakeApi,
  jsonReply,
  type FakeRoutes,
} from "@/test-support/fake-api";
import {
  forgetToasts,
  INVITATIONS_ROUTE,
  invitationsReply,
  MEMBERS_ROUTE,
  membersReply,
  noContentReply,
  ORGANIZATION_ROUTE,
  organizationReply,
  pendingInvitation,
  SHORT_TRACE_ID,
  signedInRoutes,
  TEAM,
  teamSeenBy,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { identityFr, ROLE_LABELS } from "../../fr";
import { TeamScreen } from "./team-screen";

const text = identityFr.team;
const pendingText = identityFr.pendingInvitations;

const PENDING = pendingInvitation({ id: "invitation-1", email: "marc@exemple.fr" });

const CHANGE_ROLE_ROUTE = "PATCH /api/members/member-luc";
const RESEND_ROUTE = "POST /api/invitations/invitation-1/resend";
const CANCEL_ROUTE = "DELETE /api/invitations/invitation-1";

const installTeam = (role: OrganizationRole, routes: FakeRoutes = {}) =>
  installFakeApi({
    ...signedInRoutes(role),
    [ORGANIZATION_ROUTE]: organizationReply(),
    [MEMBERS_ROUTE]: membersReply(teamSeenBy(role)),
    [INVITATIONS_ROUTE]: invitationsReply([PENDING]),
    ...routes,
  });

const renderTeam = async () => {
  const rendered = renderScreen(<TeamScreen />, { path: "/equipe" });
  await screen.findByText(TEAM.technician.name);
  await screen.findByText(text.you);
  return rendered;
};

const technicianRoleButton = () =>
  screen.getByRole("button", { name: text.roleLabel(TEAM.technician.name) });

describe("MemberRow role and invitation actions", () => {
  afterEach(forgetToasts);

  it.each<OrganizationRole>(["owner", "admin"])(
    "a %s can give every role except owner",
    async (role) => {
      installTeam(role);
      const { user } = await renderTeam();

      await user.click(technicianRoleButton());

      const options = await screen.findAllByRole("menuitemradio");
      expect(options.map((option) => option.textContent)).toEqual([
        ROLE_LABELS.admin,
        ROLE_LABELS.secretary,
        ROLE_LABELS.technician,
      ]);
      expect(screen.getByRole("menuitemradio", { name: ROLE_LABELS.technician })).toBeChecked();
    },
  );

  it("disables the role and actions menus of a member while the role change is pending", async () => {
    const change = heldReply(noContentReply());
    installTeam("owner", { [CHANGE_ROLE_ROUTE]: change.reply });
    const { user } = await renderTeam();

    await user.click(technicianRoleButton());
    await user.click(await screen.findByRole("menuitemradio", { name: ROLE_LABELS.secretary }));

    await waitFor(() => expect(technicianRoleButton()).toBeDisabled());
    expect(
      screen.getByRole("button", { name: text.actionsFor(TEAM.technician.name) }),
    ).toBeDisabled();

    change.release();

    expect(
      await screen.findByText(text.roleChanged(TEAM.technician.name, ROLE_LABELS.secretary)),
    ).toBeVisible();
  });

  it("does not send anything when the current role is chosen again", async () => {
    const api = installTeam("owner", { [CHANGE_ROLE_ROUTE]: noContentReply() });
    const { user } = await renderTeam();

    await user.click(technicianRoleButton());
    await user.click(await screen.findByRole("menuitemradio", { name: ROLE_LABELS.technician }));

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(api.requestsTo(CHANGE_ROLE_ROUTE)).toHaveLength(0);
  });

  it("shows a refused role change with the short trace id and keeps the previous role", async () => {
    installTeam("owner", {
      [CHANGE_ROLE_ROUTE]: errorReply("forbidden", TRACE_ID, 403),
    });
    const { user } = await renderTeam();

    await user.click(technicianRoleButton());
    await user.click(await screen.findByRole("menuitemradio", { name: ROLE_LABELS.secretary }));

    expect(await screen.findByText(fr.errors.messages.forbidden)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(
      screen.queryByText(text.roleChanged(TEAM.technician.name, ROLE_LABELS.secretary)),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(technicianRoleButton()).toBeEnabled());
    expect(technicianRoleButton()).toHaveTextContent(ROLE_LABELS.technician);
  });

  it("disables resend and cancel while an invitation is being resent", async () => {
    const resend = heldReply(jsonReply({}));
    const api = installTeam("owner", { [RESEND_ROUTE]: resend.reply });
    const { user } = await renderTeam();

    const card = closestOf(await screen.findByText(PENDING.email), "li");
    const resendButton = within(card).getByRole("button", { name: pendingText.resend });
    await user.click(resendButton);

    await waitFor(() => expect(resendButton).toBeDisabled());
    expect(
      within(card).getByRole("button", { name: `${pendingText.cancel} ${PENDING.email}` }),
    ).toBeDisabled();

    resend.release();

    expect(await screen.findByText(pendingText.resent(PENDING.email))).toBeVisible();
    expect(api.requestsTo(RESEND_ROUTE)).toHaveLength(1);
  });

  it("shows a failed resend with the short trace id", async () => {
    installTeam("owner", { [RESEND_ROUTE]: errorReply("internal", TRACE_ID) });
    const { user } = await renderTeam();

    const card = closestOf(await screen.findByText(PENDING.email), "li");
    await user.click(within(card).getByRole("button", { name: pendingText.resend }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.queryByText(pendingText.resent(PENDING.email))).not.toBeInTheDocument();
  });

  it("shows a failed cancellation with the short trace id and keeps the invitation", async () => {
    installTeam("owner", { [CANCEL_ROUTE]: errorReply("invitation_not_found", TRACE_ID, 404) });
    const { user } = await renderTeam();

    const card = closestOf(await screen.findByText(PENDING.email), "li");
    await user.click(
      within(card).getByRole("button", { name: `${pendingText.cancel} ${PENDING.email}` }),
    );

    expect(await screen.findByText(fr.errors.messages.invitation_not_found)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.queryByText(pendingText.canceled(PENDING.email))).not.toBeInTheDocument();
    expect(screen.getByText(PENDING.email)).toBeVisible();
  });
});
