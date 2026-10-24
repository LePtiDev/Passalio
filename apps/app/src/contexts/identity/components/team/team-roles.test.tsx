import type { OrganizationRole } from "@passalio/shared";
import { screen, within } from "@testing-library/react";
import type { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { installFakeApi } from "@/test-support/fake-api";
import { closestOf } from "@/test-support/closest";
import {
  actorReply,
  aloneAs,
  INVITATIONS_ROUTE,
  invitationsReply,
  ME_ROUTE,
  MEMBERS_ROUTE,
  membersReply,
  ORGANIZATION_ROUTE,
  organizationReply,
  pendingInvitation,
  signedInRoutes,
  TEAM,
  teamSeenBy,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { identityFr } from "../../fr";
import { TeamScreen } from "./team-screen";

const text = identityFr.team;
const pendingText = identityFr.pendingInvitations;

const PENDING = pendingInvitation({ id: "invitation-1", email: "marc@exemple.fr" });

type ActorOptions = { readonly isImpersonating?: boolean };

const installTeam = (
  role: OrganizationRole,
  members = teamSeenBy(role),
  options: ActorOptions = {},
) =>
  installFakeApi({
    ...signedInRoutes(role),
    [ME_ROUTE]: actorReply(role, options),
    [ORGANIZATION_ROUTE]: organizationReply(),
    [MEMBERS_ROUTE]: membersReply(members),
    [INVITATIONS_ROUTE]: invitationsReply([PENDING]),
  });

const renderTeam = () => renderScreen(<TeamScreen />, { path: "/equipe" });

const waitForMembers = () => screen.findByText(TEAM.technician.name);

const openActionsOf = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole("button", { name: text.actionsFor(name) }));
  return screen.findByRole("menu");
};

const otherManageableMembers = (role: OrganizationRole) =>
  Object.values(TEAM).filter((member) => member.role !== "owner" && member.role !== role);

describe("TeamScreen actions by role", () => {
  it.each<OrganizationRole>(["owner", "admin"])(
    "a %s can invite, change roles and remove the other members",
    async (role) => {
      installTeam(role);
      renderTeam();
      await waitForMembers();

      expect(await screen.findAllByRole("button", { name: identityFr.invite.title })).toHaveLength(
        2,
      );
      for (const member of otherManageableMembers(role)) {
        expect(
          screen.getByRole("button", { name: text.roleLabel(member.name, member.role) }),
        ).toBeVisible();
        expect(screen.getByRole("button", { name: text.actionsFor(member.name) })).toBeVisible();
      }
    },
  );

  it.each<OrganizationRole>(["owner", "admin"])(
    "a %s can neither change the owner nor themselves",
    async (role) => {
      installTeam(role);
      renderTeam();
      await waitForMembers();
      await screen.findAllByRole("button", { name: identityFr.invite.title });

      expect(
        screen.queryByRole("button", { name: text.roleLabel(TEAM.owner.name, TEAM.owner.role) }),
      ).toBeNull();
      expect(screen.queryByRole("button", { name: text.actionsFor(TEAM.owner.name) })).toBeNull();
      expect(
        screen.queryByRole("button", { name: text.roleLabel(TEAM[role].name, TEAM[role].role) }),
      ).toBeNull();
      expect(screen.queryByRole("button", { name: text.actionsFor(TEAM[role].name) })).toBeNull();
    },
  );

  it("only the owner is offered to transfer the ownership, and only to an administrator", async () => {
    installTeam("owner");
    const { user } = renderTeam();
    await waitForMembers();

    const adminMenu = await openActionsOf(user, TEAM.admin.name);
    expect(within(adminMenu).getByRole("menuitem", { name: text.transfer })).toBeVisible();
    expect(within(adminMenu).getByRole("menuitem", { name: text.remove })).toBeVisible();
    await user.keyboard("{Escape}");

    const technicianMenu = await openActionsOf(user, TEAM.technician.name);
    expect(within(technicianMenu).queryByRole("menuitem", { name: text.transfer })).toBeNull();
  });

  it("an admin is not offered to transfer the ownership", async () => {
    installTeam("admin");
    const { user } = renderTeam();
    await waitForMembers();

    const menu = await openActionsOf(user, TEAM.secretary.name);
    expect(within(menu).getByRole("menuitem", { name: text.remove })).toBeVisible();
    expect(within(menu).queryByRole("menuitem", { name: text.transfer })).toBeNull();
  });

  it.each<OrganizationRole>(["owner", "admin"])(
    "a %s can resend and cancel a pending invitation",
    async (role) => {
      installTeam(role);
      const { user } = renderTeam();
      await waitForMembers();

      await user.click(screen.getByRole("tab", { name: new RegExp(text.pendingTabShort) }));
      const card = closestOf(await screen.findByText(PENDING.email), "li");

      expect(within(card).getByRole("button", { name: pendingText.resend })).toBeVisible();
      expect(
        within(card).getByRole("button", { name: `${pendingText.cancel} ${PENDING.email}` }),
      ).toBeVisible();
    },
  );

  it.each<OrganizationRole>(["secretary", "technician"])(
    "a %s sees the team without any management action",
    async (role) => {
      installTeam(role);
      renderTeam();
      await waitForMembers();
      const card = closestOf(await screen.findByText(PENDING.email), "li");

      expect(screen.queryByRole("button", { name: identityFr.invite.title })).toBeNull();
      for (const member of Object.values(TEAM)) {
        expect(
          screen.queryByRole("button", { name: text.roleLabel(member.name, member.role) }),
        ).toBeNull();
        expect(screen.queryByRole("button", { name: text.actionsFor(member.name) })).toBeNull();
      }
      expect(within(card).queryByRole("button")).toBeNull();
    },
  );

  it.each<OrganizationRole>(["secretary", "technician"])(
    "a %s alone in the team sees the empty state without the invite action",
    async (role) => {
      installFakeApi({
        ...signedInRoutes(role),
        [ORGANIZATION_ROUTE]: organizationReply(),
        [MEMBERS_ROUTE]: membersReply(aloneAs(role)),
        [INVITATIONS_ROUTE]: invitationsReply([]),
      });
      renderTeam();

      expect(await screen.findByText(text.emptyTitle)).toBeVisible();
      expect(screen.queryByRole("button", { name: text.emptyAction })).toBeNull();
    },
  );

  it("an owner seen through an impersonation gets no management action", async () => {
    installTeam("owner", teamSeenBy("owner"), { isImpersonating: true });
    renderTeam();
    await waitForMembers();
    await screen.findByText(PENDING.email);

    expect(screen.queryByRole("button", { name: identityFr.invite.title })).toBeNull();
    expect(
      screen.queryByRole("button", { name: text.roleLabel(TEAM.admin.name, TEAM.admin.role) }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: text.actionsFor(TEAM.admin.name) })).toBeNull();
    expect(screen.queryByRole("button", { name: pendingText.resend })).toBeNull();
  });
});

const waitForActor = () => screen.findByText(text.you);

describe("TeamScreen actions once the role is known", () => {
  it.each<OrganizationRole>(["secretary", "technician"])(
    "a %s whose role is loaded sees no invite, role or member action",
    async (role) => {
      installTeam(role);
      renderTeam();
      await waitForMembers();
      await waitForActor();

      expect(screen.queryByRole("button", { name: identityFr.invite.title })).toBeNull();
      for (const member of Object.values(TEAM)) {
        expect(
          screen.queryByRole("button", { name: text.roleLabel(member.name, member.role) }),
        ).toBeNull();
        expect(screen.queryByRole("button", { name: text.actionsFor(member.name) })).toBeNull();
      }
    },
  );

  it.each<OrganizationRole>(["secretary", "technician"])(
    "a %s sees the pending invitations tab without resend or cancel",
    async (role) => {
      installTeam(role);
      const { user } = renderTeam();
      await waitForMembers();
      await waitForActor();

      await user.click(screen.getByRole("tab", { name: new RegExp(text.pendingTabShort) }));
      const card = closestOf(await screen.findByText(PENDING.email), "li");

      expect(within(card).queryByRole("button", { name: pendingText.resend })).toBeNull();
      expect(
        within(card).queryByRole("button", { name: `${pendingText.cancel} ${PENDING.email}` }),
      ).toBeNull();
    },
  );

  it.each<OrganizationRole>(["secretary", "technician"])(
    "a %s sees the empty pending tab without the invite action",
    async (role) => {
      installFakeApi({
        ...signedInRoutes(role),
        [ORGANIZATION_ROUTE]: organizationReply(),
        [MEMBERS_ROUTE]: membersReply(teamSeenBy(role)),
        [INVITATIONS_ROUTE]: invitationsReply([]),
      });
      const { user } = renderTeam();
      await waitForMembers();
      await waitForActor();

      await user.click(screen.getByRole("tab", { name: new RegExp(text.pendingTabShort) }));

      expect(await screen.findByText(pendingText.emptyTitle)).toBeVisible();
      expect(screen.queryByRole("button", { name: text.emptyAction })).toBeNull();
    },
  );

  it("an owner seen through an impersonation can neither cancel an invitation nor manage a member", async () => {
    installTeam("owner", teamSeenBy("owner"), { isImpersonating: true });
    const { user } = renderTeam();
    await waitForMembers();
    await waitForActor();
    const card = closestOf(await screen.findByText(PENDING.email), "li");

    expect(within(card).queryByRole("button")).toBeNull();
    for (const member of Object.values(TEAM)) {
      expect(
        screen.queryByRole("button", { name: text.roleLabel(member.name, member.role) }),
      ).toBeNull();
      expect(screen.queryByRole("button", { name: text.actionsFor(member.name) })).toBeNull();
    }

    await user.click(screen.getByRole("tab", { name: new RegExp(text.pendingTabShort) }));
    const pendingCard = closestOf(await screen.findByText(PENDING.email), "li");
    expect(within(pendingCard).queryByRole("button")).toBeNull();
  });

  it("an owner seen through an impersonation gets no invite action in an empty team", async () => {
    installFakeApi({
      ...signedInRoutes("owner"),
      [ME_ROUTE]: actorReply("owner", { isImpersonating: true }),
      [ORGANIZATION_ROUTE]: organizationReply(),
      [MEMBERS_ROUTE]: membersReply(aloneAs("owner")),
      [INVITATIONS_ROUTE]: invitationsReply([]),
    });
    renderTeam();
    await waitForActor();

    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
    expect(screen.queryByRole("button", { name: text.emptyAction })).toBeNull();
    expect(screen.queryByRole("button", { name: identityFr.invite.title })).toBeNull();
  });
});
