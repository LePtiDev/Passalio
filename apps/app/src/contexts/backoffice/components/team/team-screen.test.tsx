import type { TeamResponse } from "@passalio/shared";
import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { teamInvitation, teammate } from "@/test-support/backoffice-records";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { teamFr } from "../../team-fr";
import { TeamScreen } from "./team-screen";

const TEAM_ROUTE = "GET /api/admin/team";

const TRACE_ID = "9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a";

const SELF_ID = "self";

const team = (overrides: Partial<TeamResponse> = {}): TeamResponse => ({
  members: [
    teammate("other", "Léa Commerciale", { role: "sales", isTwoFactorEnabled: false }),
    teammate(SELF_ID, "Quentin Admin", { role: "superadmin" }),
  ],
  invitations: [],
  ...overrides,
});

const renderTeam = () =>
  renderScreen(<TeamScreen currentUserId={SELF_ID} />, { path: "/admin/equipe" });

const rowOf = (text: string) => {
  const row = screen.getAllByText(text)[0]?.closest("li");
  if (row === null || row === undefined) {
    throw new Error(`no row shows ${text}`);
  }
  return row;
};

const membersList = () => {
  const list = rowOf(teamFr.you).closest("ul");
  if (list === null) {
    throw new Error("the members are not in a list");
  }
  return list;
};

const openInviteDialog = async (user: ReturnType<typeof renderTeam>["user"]) => {
  const [inviteButton] = await screen.findAllByRole("button", { name: teamFr.invite });
  if (inviteButton === undefined) {
    throw new Error("no invite button");
  }
  await user.click(inviteButton);
  return screen.findByRole("dialog", { name: teamFr.inviteDialog.title });
};

describe("TeamScreen", () => {
  it("shows a skeleton of the members while the team loads", async () => {
    const reply = heldReply(jsonReply(team()));
    installFakeApi({ [TEAM_ROUTE]: reply.reply });

    renderTeam();

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.getByText(teamFr.subtitleLoading)).toBeInTheDocument();
    expect(screen.queryByText(teamFr.you)).not.toBeInTheDocument();

    reply.release();

    expect(await screen.findByText(teamFr.you)).toBeInTheDocument();
    expect(busyRegions()).toHaveLength(0);
  });

  it("shows the error with the short trace id and loads the team again on retry", async () => {
    const api = installFakeApi({ [TEAM_ROUTE]: errorReply("internal", TRACE_ID) });

    const { user } = renderTeam();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(teamFr.loadError);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(TEAM_ROUTE, jsonReply(team()));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByText(teamFr.you)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the signed-in member first without actions on their own row", async () => {
    installFakeApi({ [TEAM_ROUTE]: jsonReply(team()) });

    renderTeam();

    expect(await screen.findByText(teamFr.subtitle(2, 0))).toBeInTheDocument();
    const [firstRow, secondRow] = within(membersList()).getAllByRole("listitem");
    if (firstRow === undefined || secondRow === undefined) {
      throw new Error("the team has two rows");
    }
    expect(firstRow).toHaveTextContent("Quentin Admin");
    expect(firstRow).toHaveTextContent(teamFr.you);
    expect(secondRow).toHaveTextContent("Léa Commerciale");
    expect(secondRow).toHaveTextContent(teamFr.twoFactorOff);
    expect(within(firstRow).queryByRole("button", { name: teamFr.changeRole })).toBeNull();
    expect(within(firstRow).queryByRole("button", { name: teamFr.remove })).toBeNull();
    expect(within(secondRow).getByRole("button", { name: teamFr.changeRole })).toBeVisible();
    expect(within(secondRow).getByRole("button", { name: teamFr.remove })).toBeVisible();
  });

  it("says there is no pending invitation and offers to invite a member", async () => {
    installFakeApi({ [TEAM_ROUTE]: jsonReply(team()) });

    renderTeam();

    const empty = await screen.findByText(teamFr.noInvitation);
    const emptyCard = empty.parentElement;
    if (emptyCard === null) {
      throw new Error("the empty invitations message has no card");
    }
    expect(within(emptyCard).getByRole("button", { name: teamFr.invite })).toBeInTheDocument();
  });

  it("invites a member with the chosen role and confirms with a toast", async () => {
    const api = installFakeApi({
      [TEAM_ROUTE]: jsonReply(team()),
      "POST /api/admin/team/invitations": jsonReply({ id: "invitation-1" }, 201),
    });

    const { user } = renderTeam();

    const dialog = await openInviteDialog(user);
    await user.type(
      within(dialog).getByLabelText(teamFr.inviteDialog.emailLabel),
      "lea@passalio.com",
    );
    await user.click(within(dialog).getByRole("radio", { name: /^Commercial/ }));
    await user.click(within(dialog).getByRole("button", { name: teamFr.inviteDialog.submit }));

    expect(await screen.findByText(teamFr.inviteDialog.sent("lea@passalio.com"))).toBeVisible();
    expect(api.requestsTo("POST /api/admin/team/invitations")[0]?.body).toEqual({
      email: "lea@passalio.com",
      role: "sales",
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(api.requestsTo(TEAM_ROUTE)).toHaveLength(2));
  });

  it("refuses an invalid email without calling the server", async () => {
    const api = installFakeApi({ [TEAM_ROUTE]: jsonReply(team()) });

    const { user } = renderTeam();

    const dialog = await openInviteDialog(user);
    await user.type(within(dialog).getByLabelText(teamFr.inviteDialog.emailLabel), "pas-un-email");
    await user.click(within(dialog).getByRole("button", { name: teamFr.inviteDialog.submit }));

    expect(await within(dialog).findByText(teamFr.inviteDialog.invalidEmail)).toBeVisible();
    expect(within(dialog).getByLabelText(teamFr.inviteDialog.emailLabel)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(api.requestsTo("POST /api/admin/team/invitations")).toHaveLength(0);
  });

  it("shows under the email that the person is already in the team", async () => {
    installFakeApi({
      [TEAM_ROUTE]: jsonReply(team()),
      "POST /api/admin/team/invitations": errorReply("already_in_team", TRACE_ID, 409),
    });

    const { user } = renderTeam();

    const dialog = await openInviteDialog(user);
    await user.type(
      within(dialog).getByLabelText(teamFr.inviteDialog.emailLabel),
      "other@passalio.test",
    );
    await user.click(within(dialog).getByRole("button", { name: teamFr.inviteDialog.submit }));

    expect(await within(dialog).findByText(fr.errors.messages.already_in_team)).toBeVisible();
    expect(screen.getByRole("dialog", { name: teamFr.inviteDialog.title })).toBeVisible();
  });

  it("changes the role of another member and confirms with a toast", async () => {
    const api = installFakeApi({
      [TEAM_ROUTE]: jsonReply(team()),
      "PATCH /api/admin/team/members/other": jsonReply({}),
    });

    const { user } = renderTeam();

    await screen.findByText(teamFr.you);
    await user.click(
      within(rowOf("Léa Commerciale")).getByRole("button", { name: teamFr.changeRole }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: teamFr.roleDialog.title("Léa Commerciale"),
    });
    expect(within(dialog).getByRole("radio", { name: /^Commercial/ })).toBeChecked();
    await user.click(within(dialog).getByRole("radio", { name: /^Admin/ }));
    await user.click(within(dialog).getByRole("button", { name: teamFr.roleDialog.submit }));

    expect(
      await screen.findByText(teamFr.roleDialog.changed("Léa Commerciale", "Admin")),
    ).toBeVisible();
    expect(api.requestsTo("PATCH /api/admin/team/members/other")[0]?.body).toEqual({
      role: "admin",
    });
  });

  it("removes another member after confirmation and confirms with a toast", async () => {
    const api = installFakeApi({
      [TEAM_ROUTE]: jsonReply(team()),
      "DELETE /api/admin/team/members/other": jsonReply(null, 204),
    });

    const { user } = renderTeam();

    await screen.findByText(teamFr.you);
    await user.click(within(rowOf("Léa Commerciale")).getByRole("button", { name: teamFr.remove }));
    const dialog = await screen.findByRole("alertdialog", {
      name: teamFr.removeDialog.title("Léa Commerciale"),
    });
    await user.click(within(dialog).getByRole("button", { name: teamFr.removeDialog.submit }));

    expect(await screen.findByText(teamFr.removeDialog.removed("Léa Commerciale"))).toBeVisible();
    expect(api.requestsTo("DELETE /api/admin/team/members/other")).toHaveLength(1);
  });

  it("lists pending invitations and resends one with a toast", async () => {
    const api = installFakeApi({
      [TEAM_ROUTE]: jsonReply(
        team({ invitations: [teamInvitation("invitation-1", "nina@passalio.com")] }),
      ),
      "POST /api/admin/team/invitations/invitation-1/resend": jsonReply({}),
    });

    const { user } = renderTeam();

    await screen.findByText("nina@passalio.com");
    const invitation = rowOf("nina@passalio.com");
    expect(invitation).toHaveTextContent(teamFr.invitedBy("Quentin Admin", "21 oct."));
    await user.click(within(invitation).getByRole("button", { name: teamFr.resend }));

    expect(await screen.findByText(teamFr.resent("nina@passalio.com"))).toBeVisible();
    expect(api.requestsTo("POST /api/admin/team/invitations/invitation-1/resend")).toHaveLength(1);
  });

  it("shows a toast with the short trace id when canceling an invitation fails", async () => {
    installFakeApi({
      [TEAM_ROUTE]: jsonReply(
        team({ invitations: [teamInvitation("invitation-1", "nina@passalio.com")] }),
      ),
      "DELETE /api/admin/team/invitations/invitation-1": errorReply("internal", TRACE_ID),
    });

    const { user } = renderTeam();

    await screen.findByText("nina@passalio.com");
    await user.click(
      within(rowOf("nina@passalio.com")).getByRole("button", { name: teamFr.cancel }),
    );

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
  });
});
