import { screen, waitFor, within } from "@testing-library/react";
import type { userEvent } from "@testing-library/user-event";
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
const inviteText = identityFr.invite;
const pendingText = identityFr.pendingInvitations;

type User = ReturnType<typeof userEvent.setup>;

const PENDING = pendingInvitation({ id: "invitation-1", email: "marc@exemple.fr" });

const installTeam = (routes: FakeRoutes = {}) =>
  installFakeApi({
    ...signedInRoutes("owner"),
    [ORGANIZATION_ROUTE]: organizationReply(),
    [MEMBERS_ROUTE]: membersReply(teamSeenBy("owner")),
    [INVITATIONS_ROUTE]: invitationsReply([PENDING]),
    ...routes,
  });

const renderTeam = async () => {
  const rendered = renderScreen(<TeamScreen />, { path: "/equipe" });
  await screen.findByText(TEAM.technician.name);
  return rendered;
};

const openInviteDialog = async (user: User) => {
  const [inviteButton] = await screen.findAllByRole("button", { name: inviteText.title });
  if (inviteButton === undefined) {
    throw new Error("no invite button");
  }
  await user.click(inviteButton);
  return screen.findByRole("dialog", { name: inviteText.title });
};

const chooseAction = async (user: User, name: string, action: string) => {
  await user.click(screen.getByRole("button", { name: text.actionsFor(name) }));
  await user.click(await screen.findByRole("menuitem", { name: action }));
  return screen.findByRole("alertdialog");
};

describe("TeamScreen management actions", () => {
  afterEach(forgetToasts);

  it("refuses an invitation without a valid email", async () => {
    const api = installTeam({ "POST /api/invitations": jsonReply({}) });
    const { user } = await renderTeam();

    const dialog = await openInviteDialog(user);
    await user.click(within(dialog).getByRole("button", { name: inviteText.submit }));

    expect(await within(dialog).findByText(identityFr.fields.invalidEmail)).toBeVisible();
    expect(api.requestsTo("POST /api/invitations")).toHaveLength(0);
  });

  it("invites a person with the chosen role, confirms with a toast and closes the dialog", async () => {
    const invite = heldReply(jsonReply({ id: "invitation-2" }));
    const api = installTeam({ "POST /api/invitations": invite.reply });
    const { user } = await renderTeam();

    const dialog = await openInviteDialog(user);
    expect(within(dialog).getByRole("combobox", { name: inviteText.roleLabel })).toHaveTextContent(
      ROLE_LABELS.technician,
    );
    await user.type(within(dialog).getByLabelText(inviteText.emailLabel), "julie@exemple.fr");
    await user.click(within(dialog).getByRole("combobox", { name: inviteText.roleLabel }));
    await user.click(await screen.findByRole("option", { name: ROLE_LABELS.secretary }));
    await user.click(within(dialog).getByRole("button", { name: inviteText.submit }));

    expect(await within(dialog).findByRole("button", { name: inviteText.sending })).toBeDisabled();
    invite.release();

    expect(await screen.findByText(inviteText.sent("julie@exemple.fr"))).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: inviteText.title })).not.toBeInTheDocument(),
    );
    expect(api.requestsTo("POST /api/invitations")[0]?.body).toEqual({
      email: "julie@exemple.fr",
      role: "secretary",
    });
  });

  it("keeps the dialog open and shows the short trace id when the invitation fails", async () => {
    installTeam({ "POST /api/invitations": errorReply("already_member", TRACE_ID, 409) });
    const { user } = await renderTeam();

    const dialog = await openInviteDialog(user);
    await user.type(within(dialog).getByLabelText(inviteText.emailLabel), "claire@exemple.fr");
    await user.click(within(dialog).getByRole("button", { name: inviteText.submit }));

    expect(await screen.findByText(fr.errors.messages.already_member)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.getByRole("dialog", { name: inviteText.title })).toBeVisible();
  });

  it("does not offer the owner role when inviting", async () => {
    installTeam();
    const { user } = await renderTeam();

    const dialog = await openInviteDialog(user);
    await user.click(within(dialog).getByRole("combobox", { name: inviteText.roleLabel }));

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      ROLE_LABELS.admin,
      ROLE_LABELS.secretary,
      ROLE_LABELS.technician,
    ]);
  });

  it("changes the role of a member and confirms with a toast", async () => {
    const api = installTeam({ "PATCH /api/members/member-luc": noContentReply() });
    const { user } = await renderTeam();

    await user.click(screen.getByRole("button", { name: text.roleLabel(TEAM.technician.name) }));
    await user.click(await screen.findByRole("menuitemradio", { name: ROLE_LABELS.secretary }));

    expect(
      await screen.findByText(text.roleChanged(TEAM.technician.name, ROLE_LABELS.secretary)),
    ).toBeVisible();
    expect(api.requestsTo("PATCH /api/members/member-luc")[0]?.body).toEqual({
      role: "secretary",
    });
  });

  it("removes a member after confirmation and confirms with a toast", async () => {
    const api = installTeam({ "DELETE /api/members/member-luc": noContentReply() });
    const { user } = await renderTeam();

    const confirm = await chooseAction(user, TEAM.technician.name, text.remove);
    expect(confirm).toHaveTextContent(text.removeTitle(TEAM.technician.name));
    expect(confirm).toHaveTextContent(text.removeText);
    await user.click(within(confirm).getByRole("button", { name: text.removeConfirm }));

    expect(await screen.findByText(text.removed(TEAM.technician.name))).toBeVisible();
    expect(api.requestsTo("DELETE /api/members/member-luc")).toHaveLength(1);
  });

  it("sends nothing when the removal is cancelled", async () => {
    const api = installTeam({ "DELETE /api/members/member-luc": noContentReply() });
    const { user } = await renderTeam();

    const confirm = await chooseAction(user, TEAM.technician.name, text.remove);
    await user.click(within(confirm).getByRole("button", { name: text.cancel }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(api.requestsTo("DELETE /api/members/member-luc")).toHaveLength(0);
  });

  it("shows a refused removal with the short trace id", async () => {
    installTeam({
      "DELETE /api/members/member-luc": errorReply("owner_cannot_be_changed", TRACE_ID, 409),
    });
    const { user } = await renderTeam();

    const confirm = await chooseAction(user, TEAM.technician.name, text.remove);
    await user.click(within(confirm).getByRole("button", { name: text.removeConfirm }));

    expect(await screen.findByText(fr.errors.messages.owner_cannot_be_changed)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
  });

  it("transfers the ownership to an administrator after confirmation", async () => {
    const api = installTeam({ "POST /api/ownership-transfer": noContentReply() });
    const { user } = await renderTeam();

    const confirm = await chooseAction(user, TEAM.admin.name, text.transfer);
    expect(confirm).toHaveTextContent(text.transferTitle(TEAM.admin.name));
    await user.click(within(confirm).getByRole("button", { name: text.transferConfirm }));

    expect(await screen.findByText(text.transferred(TEAM.admin.name))).toBeVisible();
    expect(api.requestsTo("POST /api/ownership-transfer")[0]?.body).toEqual({
      memberId: "member-claire",
    });
  });

  it("resends a pending invitation and confirms with a toast", async () => {
    const api = installTeam({ "POST /api/invitations/invitation-1/resend": jsonReply({}) });
    const { user } = await renderTeam();

    const card = closestOf(await screen.findByText(PENDING.email), "li");
    await user.click(within(card).getByRole("button", { name: pendingText.resend }));

    expect(await screen.findByText(pendingText.resent(PENDING.email))).toBeVisible();
    expect(api.requestsTo("POST /api/invitations/invitation-1/resend")).toHaveLength(1);
  });

  it("cancels a pending invitation and confirms with a toast", async () => {
    const api = installTeam({ "DELETE /api/invitations/invitation-1": noContentReply() });
    const { user } = await renderTeam();

    const card = closestOf(await screen.findByText(PENDING.email), "li");
    api.setRoute(INVITATIONS_ROUTE, invitationsReply([]));
    await user.click(
      within(card).getByRole("button", { name: `${pendingText.cancel} ${PENDING.email}` }),
    );

    expect(await screen.findByText(pendingText.canceled(PENDING.email))).toBeVisible();
    expect(api.requestsTo("DELETE /api/invitations/invitation-1")).toHaveLength(1);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: pendingText.resend })).not.toBeInTheDocument(),
    );
  });
});
