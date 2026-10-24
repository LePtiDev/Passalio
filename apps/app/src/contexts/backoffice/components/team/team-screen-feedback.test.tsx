import type { TeamResponse } from "@passalio/shared";
import { screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { teamInvitation, teammate } from "@/test-support/backoffice-records";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { teamFr } from "../../team-fr";
import { TeamScreen } from "./team-screen";

const TEAM_ROUTE = "GET /api/admin/team";
const INVITE_ROUTE = "POST /api/admin/team/invitations";

const TRACE_ID = "a1b2c3d4-e5f6-4789-8abc-def012345678";

const SELF_ID = "self";

const team = (overrides: Partial<TeamResponse> = {}): TeamResponse => ({
  members: [
    teammate("other", "Léa Commerciale", { role: "sales" }),
    teammate(SELF_ID, "Quentin Admin", { role: "superadmin" }),
  ],
  invitations: [],
  ...overrides,
});

const renderTeam = () =>
  renderScreen(<TeamScreen currentUserId={SELF_ID} />, { path: "/admin/equipe" });

const openInviteDialog = async (user: ReturnType<typeof renderTeam>["user"]) => {
  const [inviteButton] = await screen.findAllByRole("button", { name: teamFr.invite });
  if (inviteButton === undefined) {
    throw new Error("no invite button");
  }
  await user.click(inviteButton);
  return screen.findByRole("dialog", { name: teamFr.inviteDialog.title });
};

const rowOf = (text: string) => {
  const row = screen.getAllByText(text)[0]?.closest("li");
  if (row === null || row === undefined) {
    throw new Error(`no row shows ${text}`);
  }
  return row;
};

describe("TeamScreen feedback and mobile actions", () => {
  afterEach(() => {
    toast.dismiss();
  });

  it("offers no mobile actions menu on the signed-in super admin's own row", async () => {
    installFakeApi({ [TEAM_ROUTE]: jsonReply(team()) });

    renderTeam();

    expect(await screen.findByText(teamFr.subtitle(2, 0))).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: teamFr.memberActions("Quentin Admin") }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: teamFr.memberActions("Léa Commerciale") }),
    ).toBeInTheDocument();
  });

  it("opens the role dialog from the mobile actions menu of another member", async () => {
    installFakeApi({ [TEAM_ROUTE]: jsonReply(team()) });

    const { user } = renderTeam();

    await user.click(
      await screen.findByRole("button", { name: teamFr.memberActions("Léa Commerciale") }),
    );
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: teamFr.remove })).toBeVisible();
    await user.click(within(menu).getByRole("menuitem", { name: teamFr.changeRole }));

    expect(
      await screen.findByRole("dialog", { name: teamFr.roleDialog.title("Léa Commerciale") }),
    ).toBeVisible();
  });

  it("disables the invite button and says it is sending while the invitation is sent", async () => {
    const invite = heldReply(jsonReply({ id: "invitation-1" }, 201));
    installFakeApi({ [TEAM_ROUTE]: jsonReply(team()), [INVITE_ROUTE]: invite.reply });

    const { user } = renderTeam();

    const dialog = await openInviteDialog(user);
    await user.type(
      within(dialog).getByLabelText(teamFr.inviteDialog.emailLabel),
      "nina-sending@passalio.com",
    );
    await user.click(within(dialog).getByRole("button", { name: teamFr.inviteDialog.submit }));

    expect(
      await within(dialog).findByRole("button", { name: teamFr.inviteDialog.sending }),
    ).toBeDisabled();
    invite.release();

    expect(
      await screen.findByText(teamFr.inviteDialog.sent("nina-sending@passalio.com")),
    ).toBeVisible();
  });

  it("keeps the invite dialog open and shows the short trace id when the invitation fails", async () => {
    installFakeApi({
      [TEAM_ROUTE]: jsonReply(team()),
      [INVITE_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const { user } = renderTeam();

    const dialog = await openInviteDialog(user);
    await user.type(
      within(dialog).getByLabelText(teamFr.inviteDialog.emailLabel),
      "nina-failure@passalio.com",
    );
    await user.click(within(dialog).getByRole("button", { name: teamFr.inviteDialog.submit }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    expect(screen.getByRole("dialog", { name: teamFr.inviteDialog.title })).toBeVisible();
    expect(within(dialog).getByLabelText(teamFr.inviteDialog.emailLabel)).toHaveValue(
      "nina-failure@passalio.com",
    );
  });

  it("does not remove the member when the confirmation is dismissed", async () => {
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
    await user.click(within(dialog).getByRole("button", { name: teamFr.cancel }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(api.requestsTo("DELETE /api/admin/team/members/other")).toHaveLength(0);
  });

  it("shows a toast with the short trace id when removing a member fails", async () => {
    const api = installFakeApi({
      [TEAM_ROUTE]: jsonReply(team()),
      "DELETE /api/admin/team/members/other": errorReply("internal", TRACE_ID),
    });

    const { user } = renderTeam();

    await screen.findByText(teamFr.you);
    await user.click(within(rowOf("Léa Commerciale")).getByRole("button", { name: teamFr.remove }));
    const dialog = await screen.findByRole("alertdialog", {
      name: teamFr.removeDialog.title("Léa Commerciale"),
    });
    await user.click(within(dialog).getByRole("button", { name: teamFr.removeDialog.submit }));

    await waitFor(() =>
      expect(api.requestsTo("DELETE /api/admin/team/members/other")).toHaveLength(1),
    );
    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    expect(screen.queryByText(teamFr.removeDialog.removed("Léa Commerciale"))).toBeNull();
  });

  it("cancels a pending invitation, confirms with a toast and reloads the team", async () => {
    const api = installFakeApi({
      [TEAM_ROUTE]: jsonReply(
        team({ invitations: [teamInvitation("invitation-2", "marc@passalio.com")] }),
      ),
      "DELETE /api/admin/team/invitations/invitation-2": jsonReply(null, 204),
    });

    const { user } = renderTeam();

    await screen.findByText("marc@passalio.com");
    await user.click(
      within(rowOf("marc@passalio.com")).getByRole("button", { name: teamFr.cancel }),
    );

    expect(await screen.findByText(teamFr.canceled("marc@passalio.com"))).toBeVisible();
    expect(api.requestsTo("DELETE /api/admin/team/invitations/invitation-2")).toHaveLength(1);
    await waitFor(() => expect(api.requestsTo(TEAM_ROUTE)).toHaveLength(2));
  });
});
