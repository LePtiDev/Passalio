import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { closestOf } from "@/test-support/closest";
import { errorReply, heldReply, installFakeApi, type FakeRoutes } from "@/test-support/fake-api";
import {
  aloneAs,
  INVITATIONS_ROUTE,
  invitationsReply,
  MEMBERS_ROUTE,
  membersReply,
  ORGANIZATION_ROUTE,
  organizationReply,
  pendingInvitation,
  SHORT_TRACE_ID,
  signedInRoutes,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { busyElementIn, findBusyElements, skeletonsIn } from "@/test-support/skeletons";
import { HomeScreen } from "./home-screen";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = fr.home;

const TWO_INVITATIONS = [
  pendingInvitation({ id: "invitation-1", email: "luc@exemple.fr" }),
  pendingInvitation({ id: "invitation-2", email: "sophie@exemple.fr", role: "secretary" }),
];

const installHome = (routes: FakeRoutes = {}) =>
  installFakeApi({
    ...signedInRoutes("owner"),
    [ORGANIZATION_ROUTE]: organizationReply({ name: "Ramonage Dupont" }),
    [MEMBERS_ROUTE]: membersReply(aloneAs("owner")),
    [INVITATIONS_ROUTE]: invitationsReply([]),
    ...routes,
  });

const renderHome = (isWelcome = false) =>
  renderScreen(<HomeScreen userName="Paul Dupont" isWelcome={isWelcome} />, { path: "/" });

const gettingStarted = async () =>
  closestOf(await screen.findByRole("heading", { name: text.gettingStarted }), "section");

describe("HomeScreen", () => {
  it("greets the user and shows a skeleton of the getting started list while loading", async () => {
    const organization = heldReply(organizationReply());
    installHome({ [ORGANIZATION_ROUTE]: organization.reply });

    const { container } = renderHome();

    expect(await screen.findByRole("heading", { name: text.greeting("Paul") })).toBeVisible();
    const skeletons = await findBusyElements(container, 2);
    expect(skeletons.map((skeleton) => skeletonsIn(skeleton).length)).toEqual([3, 21]);
    expect(screen.queryByRole("heading", { name: text.gettingStarted })).toBeNull();

    organization.release();

    expect(await gettingStarted()).toBeVisible();
    expect(busyElementIn(container)).toBeNull();
  });

  it("shows the load error with the short trace id and retries on demand", async () => {
    const api = installHome({ [INVITATIONS_ROUTE]: errorReply("internal", TRACE_ID) });

    const { user } = renderHome();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(SHORT_TRACE_ID));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(INVITATIONS_ROUTE, invitationsReply([]));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await gettingStarted()).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the six first steps and points to the team invitation when the owner is alone", async () => {
    installHome();

    const { user, router } = renderHome();

    const card = await gettingStarted();
    expect(within(card).getAllByRole("listitem")).toHaveLength(6);
    expect(within(card).getByText(text.progressLabel(1, 6))).toBeInTheDocument();
    expect(within(card).getByText(text.tasks.company.title)).toBeVisible();
    expect(within(card).getAllByText(fr.shell.soon)).toHaveLength(4);
    const invite = within(card).getByRole("link", { name: new RegExp(text.tasks.team.title) });
    expect(invite).toHaveTextContent(text.tasks.team.action);

    await user.click(invite);

    expect(router.state.location.pathname).toBe("/equipe");
  });

  it("marks the team step done once people are invited", async () => {
    installHome({ [INVITATIONS_ROUTE]: invitationsReply(TWO_INVITATIONS) });

    renderHome();

    const card = await gettingStarted();
    expect(within(card).getByText(text.progressLabel(2, 6))).toBeInTheDocument();
    expect(within(card).getByText(text.tasks.team.doneText(2))).toBeInTheDocument();
    expect(within(card).queryByRole("link")).toBeNull();
  });

  it("welcomes the owner after the configuration with the number of invitations sent", async () => {
    installHome({ [INVITATIONS_ROUTE]: invitationsReply(TWO_INVITATIONS) });

    renderHome(true);

    expect(await screen.findByText(text.readyWithInvitations(2))).toBeVisible();
  });

  it("welcomes the owner without invitations", async () => {
    installHome();

    renderHome(true);

    expect(await screen.findByText(text.ready)).toBeVisible();
  });

  it("shows no welcome banner on a normal visit", async () => {
    installHome();

    renderHome(false);

    await gettingStarted();
    expect(screen.queryByText(text.ready)).toBeNull();
  });

  it("opens the settings from the avatar on mobile", async () => {
    installHome();

    const { user, router } = renderHome();

    await user.click(await screen.findByRole("link", { name: fr.shell.settings }));

    expect(router.state.location.pathname).toBe("/reglages");
  });
});
