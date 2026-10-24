import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { closestOf } from "@/test-support/closest";
import { errorReply, heldReply, installFakeApi } from "@/test-support/fake-api";
import {
  aloneAs,
  forgetToasts,
  INVITATIONS_ROUTE,
  invitationsReply,
  MEMBERS_ROUTE,
  membersReply,
  ORGANIZATION_ROUTE,
  organizationReply,
  pendingInvitation,
  SHORT_TRACE_ID,
  signedInRoutes,
  teamSeenBy,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { busyElementIn, findBusyElement, skeletonsIn } from "@/test-support/skeletons";
import { identityFr, ROLE_LABELS } from "../../fr";
import { TeamScreen } from "./team-screen";
import { TeamScreenSkeleton } from "./team-skeleton";

const text = identityFr.team;
const pendingText = identityFr.pendingInvitations;

const baseRoutes = () => ({
  ...signedInRoutes("owner"),
  [ORGANIZATION_ROUTE]: organizationReply({ name: "Ramonage Dupont" }),
  [INVITATIONS_ROUTE]: invitationsReply([]),
});

const renderTeam = () => renderScreen(<TeamScreen />, { path: "/equipe" });

const pendingTab = () => screen.getByRole("tab", { name: new RegExp(text.pendingTabShort) });

const membersList = async () => closestOf(await screen.findByText("Claire Martin"), "ul");

describe("TeamScreen", () => {
  afterEach(forgetToasts);

  it("shows a skeleton shaped like the member rows while the team loads", async () => {
    const members = heldReply(membersReply(teamSeenBy("owner")));
    installFakeApi({ ...baseRoutes(), [MEMBERS_ROUTE]: members.reply });

    const { container } = renderTeam();

    const skeleton = await findBusyElement(container);
    expect(within(skeleton).getAllByRole("listitem")).toHaveLength(3);
    expect(skeletonsIn(skeleton).length).toBeGreaterThanOrEqual(9);
    expect(screen.queryByText("Claire Martin")).not.toBeInTheDocument();

    members.release();

    expect(await screen.findByText("Claire Martin")).toBeVisible();
    expect(busyElementIn(container)).toBeNull();
  });

  it("shows a page skeleton with the title, the tabs and three member rows while the route loads", async () => {
    installFakeApi(baseRoutes());

    const { container } = renderScreen(<TeamScreenSkeleton />, { path: "/equipe" });

    const page = await findBusyElement(container);
    const rows = within(page).getByRole("list");
    expect(rows).toHaveAttribute("aria-busy", "true");
    expect(within(rows).getAllByRole("listitem")).toHaveLength(3);
    expect(skeletonsIn(page)).toHaveLength(skeletonsIn(rows).length + 3);
  });

  it("lists the members with their role, marks the current user and counts them", async () => {
    installFakeApi({ ...baseRoutes(), [MEMBERS_ROUTE]: membersReply(teamSeenBy("owner")) });

    renderTeam();

    const list = await membersList();
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    const ownerRow = closestOf(within(list).getByText("Paul Dupont"), "li");
    expect(within(ownerRow).getByText(text.you)).toBeVisible();
    expect(within(ownerRow).getByText(ROLE_LABELS.owner)).toBeVisible();
    expect(within(list).getByText("member-claire@exemple.fr")).toBeVisible();
    expect(screen.getAllByRole("heading", { name: text.title }).length).toBeGreaterThan(0);
    expect(screen.getByText(text.subtitle("Ramonage Dupont"))).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: new RegExp(text.membersTab) })).toHaveTextContent("4"),
    );
  });

  it("shows a skeleton instead of an incomplete subtitle while the company name loads", async () => {
    const organization = heldReply(organizationReply({ name: "Ramonage Dupont" }));
    installFakeApi({
      ...baseRoutes(),
      [ORGANIZATION_ROUTE]: organization.reply,
      [MEMBERS_ROUTE]: membersReply(teamSeenBy("owner")),
    });

    renderTeam();

    await membersList();
    expect(screen.queryByText(text.subtitle(""))).not.toBeInTheDocument();

    organization.release();

    expect(await screen.findByText(text.subtitle("Ramonage Dupont"))).toBeVisible();
  });

  it("invites a first person from the empty team", async () => {
    installFakeApi({ ...baseRoutes(), [MEMBERS_ROUTE]: membersReply(aloneAs("owner")) });

    const { user } = renderTeam();

    const emptyTitle = await screen.findByText(text.emptyTitle);
    const card = within(closestOf(emptyTitle, "div"));
    expect(card.getByText(text.emptyText)).toBeVisible();

    await user.click(card.getByRole("button", { name: text.emptyAction }));

    expect(await screen.findByRole("dialog", { name: identityFr.invite.title })).toBeVisible();
  });

  it("shows the load error with the short trace id and retries on demand", async () => {
    const api = installFakeApi({
      ...baseRoutes(),
      [MEMBERS_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const { user } = renderTeam();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(SHORT_TRACE_ID));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(MEMBERS_ROUTE, membersReply(teamSeenBy("owner")));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByText("Claire Martin")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the pending invitations with their role and expiry", async () => {
    installFakeApi({
      ...baseRoutes(),
      [MEMBERS_ROUTE]: membersReply(teamSeenBy("owner")),
      [INVITATIONS_ROUTE]: invitationsReply([
        pendingInvitation({ id: "invitation-1", email: "marc@exemple.fr", role: "secretary" }),
        pendingInvitation({
          id: "invitation-2",
          email: "julie@exemple.fr",
          expiresAt: new Date(Date.now() - 86_400_000),
        }),
      ]),
    });

    const { user } = renderTeam();

    await waitFor(() => expect(pendingTab()).toHaveTextContent("2"));
    await user.click(pendingTab());

    const marcCard = closestOf(await screen.findByText("marc@exemple.fr"), "li");
    expect(marcCard).toHaveTextContent(ROLE_LABELS.secretary);
    expect(marcCard).toHaveTextContent(pendingText.expiresIn(6));
    expect(closestOf(screen.getByText("julie@exemple.fr"), "li")).toHaveTextContent(
      pendingText.expired,
    );
  });

  it("offers to invite someone when no invitation is pending", async () => {
    installFakeApi({ ...baseRoutes(), [MEMBERS_ROUTE]: membersReply(teamSeenBy("owner")) });

    const { user } = renderTeam();

    await user.click(await screen.findByRole("tab", { name: new RegExp(text.pendingTabShort) }));

    const emptyTitle = await screen.findByText(pendingText.emptyTitle);
    const card = within(closestOf(emptyTitle, "div"));
    expect(card.getByText(pendingText.emptyText)).toBeVisible();
    await user.click(card.getByRole("button", { name: text.emptyAction }));

    expect(await screen.findByRole("dialog", { name: identityFr.invite.title })).toBeVisible();
  });

  it("shows the pending invitations error with the short trace id", async () => {
    installFakeApi({
      ...baseRoutes(),
      [MEMBERS_ROUTE]: membersReply(teamSeenBy("owner")),
      [INVITATIONS_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const { user } = renderTeam();

    await user.click(await screen.findByRole("tab", { name: new RegExp(text.pendingTabShort) }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.code(SHORT_TRACE_ID));
    expect(within(alert).getByRole("button", { name: fr.errors.retry })).toBeVisible();
  });
});

describe("TeamScreen pending tab", () => {
  afterEach(forgetToasts);

  it("shows a skeleton shaped like the invitation rows while the pending invitations load", async () => {
    const invitations = heldReply(
      invitationsReply([pendingInvitation({ id: "invitation-1", email: "marc@exemple.fr" })]),
    );
    installFakeApi({
      ...baseRoutes(),
      [MEMBERS_ROUTE]: membersReply(teamSeenBy("owner")),
      [INVITATIONS_ROUTE]: invitations.reply,
    });

    const { user, container } = renderTeam();
    await membersList();
    await user.click(pendingTab());

    const skeleton = await findBusyElement(container);
    expect(within(skeleton).getAllByRole("listitem")).toHaveLength(3);
    expect(skeletonsIn(skeleton).length).toBeGreaterThanOrEqual(9);
    expect(screen.queryByText(pendingText.emptyTitle)).not.toBeInTheDocument();

    invitations.release();

    expect(await screen.findByText("marc@exemple.fr")).toBeVisible();
    expect(busyElementIn(container)).toBeNull();
  });

  it("loads the next page of pending invitations on demand", async () => {
    const api = installFakeApi({
      ...baseRoutes(),
      [MEMBERS_ROUTE]: membersReply(teamSeenBy("owner")),
      [INVITATIONS_ROUTE]: (request) =>
        request.search.get("cursor") === "page-2"
          ? invitationsReply([pendingInvitation({ id: "invitation-2", email: "julie@exemple.fr" })])
          : invitationsReply(
              [pendingInvitation({ id: "invitation-1", email: "marc@exemple.fr" })],
              "page-2",
            ),
    });

    const { user } = renderTeam();
    await membersList();
    await user.click(pendingTab());

    expect(await screen.findByText("marc@exemple.fr")).toBeVisible();
    expect(screen.queryByText("julie@exemple.fr")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: text.loadMore }));

    expect(await screen.findByText("julie@exemple.fr")).toBeVisible();
    expect(screen.getByText("marc@exemple.fr")).toBeVisible();
    expect(screen.queryByRole("button", { name: text.loadMore })).not.toBeInTheDocument();
    expect(api.requestsTo(INVITATIONS_ROUTE).map(({ search }) => search.get("cursor"))).toContain(
      "page-2",
    );
  });
});
