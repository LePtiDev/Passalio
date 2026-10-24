import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fr } from "@/fr";
import {
  errorReply,
  heldReply,
  installFakeApi,
  jsonReply,
  type FakeRoutes,
} from "@/test-support/fake-api";
import {
  forgetToasts,
  noContentReply,
  ORGANIZATION_ROUTE,
  organizationReply,
  SHORT_TRACE_ID,
  signedInRoutes,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { identityFr, ROLE_LABELS } from "../../fr";
import { onboardingFr } from "../../onboarding-fr";
import { TeamStep } from "./team-step";

const text = onboardingFr.team;

const INVITE_ROUTE = "POST /api/invitations";
const COMPLETION_ROUTE = "POST /api/organization/onboarding-completion";

const installTeamStep = (routes: FakeRoutes = {}) =>
  installFakeApi({
    ...signedInRoutes("owner"),
    [INVITE_ROUTE]: jsonReply({ id: "invitation-1" }),
    [COMPLETION_ROUTE]: noContentReply(),
    [ORGANIZATION_ROUTE]: organizationReply(),
    ...routes,
  });

const renderTeamStep = () => renderScreen(<TeamStep />, { path: "/configuration/equipe" });

describe("TeamStep", () => {
  afterEach(forgetToasts);

  it("starts with three empty rows and cannot send until an address is typed", async () => {
    installTeamStep();
    const { user } = renderTeamStep();

    expect(await screen.findByLabelText(text.emailLabel(3))).toHaveValue("");
    expect(screen.queryByLabelText(text.emailLabel(4))).toBeNull();
    expect(screen.getByRole("button", { name: text.send(0) })).toBeDisabled();

    await user.type(screen.getByLabelText(text.emailLabel(1)), "luc@exemple.fr");

    expect(screen.getByRole("button", { name: text.send(1) })).toBeEnabled();
  });

  it("shows the French message for an invalid address and sends nothing", async () => {
    const api = installTeamStep();
    const { user } = renderTeamStep();

    await user.type(await screen.findByLabelText(text.emailLabel(1)), "luc@");
    await user.click(screen.getByRole("button", { name: text.send(1) }));

    expect(await screen.findByText(identityFr.fields.invalidEmail)).toBeVisible();
    expect(screen.getByLabelText(text.emailLabel(1))).toHaveAttribute("aria-invalid", "true");
    expect(api.requestsTo(INVITE_ROUTE)).toHaveLength(0);
    expect(api.requestsTo(COMPLETION_ROUTE)).toHaveLength(0);
  });

  it("sends the invitations with their role, confirms with a toast and opens the welcome home", async () => {
    const api = installTeamStep();
    const { user, router } = renderTeamStep();

    await user.type(await screen.findByLabelText(text.emailLabel(1)), "luc@exemple.fr");
    await user.type(screen.getByLabelText(text.emailLabel(2)), "sophie@exemple.fr");
    await user.click(screen.getByRole("combobox", { name: text.roleLabel(2) }));
    await user.click(await screen.findByRole("option", { name: ROLE_LABELS.secretary }));
    await user.click(screen.getByRole("button", { name: text.send(2) }));

    expect(await screen.findByText(text.sent(2))).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(router.state.location.search).toEqual({ bienvenue: true });
    expect(api.requestsTo(INVITE_ROUTE).map(({ body }) => body)).toEqual([
      { email: "luc@exemple.fr", role: "technician" },
      { email: "sophie@exemple.fr", role: "secretary" },
    ]);
    expect(api.requestsTo(COMPLETION_ROUTE)).toHaveLength(1);
  });

  it("warns when only part of the invitations were sent and still finishes", async () => {
    const api = installTeamStep({
      [INVITE_ROUTE]: (request) =>
        JSON.stringify(request.body).includes("luc@")
          ? jsonReply({ id: "invitation-1" })
          : errorReply("already_member", TRACE_ID, 409),
    });
    const { user, router } = renderTeamStep();

    await user.type(await screen.findByLabelText(text.emailLabel(1)), "luc@exemple.fr");
    await user.type(screen.getByLabelText(text.emailLabel(2)), "claire@exemple.fr");
    await user.click(screen.getByRole("button", { name: text.send(2) }));

    expect(await screen.findByText(text.partlySent(1, 1))).toBeVisible();
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(api.requestsTo(COMPLETION_ROUTE)).toHaveLength(1);
  });

  it("shows the short trace id of a refused invitation", async () => {
    installTeamStep({
      [INVITE_ROUTE]: (request) =>
        JSON.stringify(request.body).includes("luc@")
          ? jsonReply({ id: "invitation-1" })
          : errorReply("already_member", TRACE_ID, 409),
    });
    const { user } = renderTeamStep();

    await user.type(await screen.findByLabelText(text.emailLabel(1)), "luc@exemple.fr");
    await user.type(screen.getByLabelText(text.emailLabel(2)), "claire@exemple.fr");
    await user.click(screen.getByRole("button", { name: text.send(2) }));

    expect(await screen.findByText(text.partlySent(1, 1))).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
  });

  it("finishes later without sending any invitation", async () => {
    const api = installTeamStep();
    const { user, router } = renderTeamStep();

    await user.click(await screen.findByRole("button", { name: onboardingFr.layout.later }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(router.state.location.search).toEqual({ bienvenue: true });
    expect(api.requestsTo(INVITE_ROUTE)).toHaveLength(0);
    expect(api.requestsTo(COMPLETION_ROUTE)).toHaveLength(1);
  });

  it("shows a pending state and blocks a second click while finishing later", async () => {
    const completion = heldReply(noContentReply());
    const api = installTeamStep({ [COMPLETION_ROUTE]: completion.reply });
    const { user, router } = renderTeamStep();

    const later = await screen.findByRole("button", { name: onboardingFr.layout.later });
    await user.click(later);

    await waitFor(() => expect(later).toBeDisabled());
    completion.release();
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(api.requestsTo(COMPLETION_ROUTE)).toHaveLength(1);
  });

  it("shows a failed completion with the short trace id and stays on the step", async () => {
    installTeamStep({ [COMPLETION_ROUTE]: errorReply("internal", TRACE_ID) });
    const { user, router } = renderTeamStep();

    await user.click(await screen.findByRole("button", { name: onboardingFr.layout.later }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(router.state.location.pathname).toBe("/configuration/equipe");
  });

  it("adds and removes invitation rows", async () => {
    installTeamStep();
    const { user } = renderTeamStep();

    await user.click(await screen.findByRole("button", { name: text.addRow }));
    expect(screen.getByLabelText(text.emailLabel(4))).toBeVisible();

    await user.click(screen.getByRole("button", { name: text.removeRow(4) }));
    expect(screen.queryByLabelText(text.emailLabel(4))).toBeNull();
  });

  it("explains what each role can do", async () => {
    installTeamStep();
    renderTeamStep();

    expect(await screen.findByText(text.roles[0].text)).toBeVisible();
    for (const { text: description } of text.roles) {
      expect(screen.getByText(description)).toBeVisible();
    }
  });
});

describe("TeamStep while sending", () => {
  afterEach(forgetToasts);

  it("shows a pending send button and blocks both buttons while the invitations are sent", async () => {
    const invitation = heldReply(jsonReply({ id: "invitation-1" }));
    const api = installTeamStep({ [INVITE_ROUTE]: invitation.reply });
    const { user, router } = renderTeamStep();

    await user.type(await screen.findByLabelText(text.emailLabel(1)), "luc@exemple.fr");
    await user.click(screen.getByRole("button", { name: text.send(1) }));

    expect(await screen.findByRole("button", { name: text.sending })).toBeDisabled();
    expect(screen.getByRole("button", { name: onboardingFr.layout.later })).toBeDisabled();

    invitation.release();

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(api.requestsTo(INVITE_ROUTE)).toHaveLength(1);
    expect(api.requestsTo(COMPLETION_ROUTE)).toHaveLength(1);
  });

  it("never offers the owner role to a new person", async () => {
    installTeamStep();
    const { user } = renderTeamStep();

    await user.click(await screen.findByRole("combobox", { name: text.roleLabel(1) }));

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).not.toContain(ROLE_LABELS.owner);
    expect(options.map((option) => option.textContent)).toContain(ROLE_LABELS.admin);
  });

  it("sends the address without the spaces typed around it", async () => {
    const api = installTeamStep();
    const { user, router } = renderTeamStep();

    await user.type(await screen.findByLabelText(text.emailLabel(1)), "  luc@exemple.fr  ");
    await user.click(screen.getByRole("button", { name: text.send(1) }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(api.requestsTo(INVITE_ROUTE).map(({ body }) => body)).toEqual([
      { email: "luc@exemple.fr", role: "technician" },
    ]);
  });

  it("ignores rows that only contain spaces", async () => {
    const api = installTeamStep();
    const { user, router } = renderTeamStep();

    await user.type(await screen.findByLabelText(text.emailLabel(1)), "luc@exemple.fr");
    await user.type(screen.getByLabelText(text.emailLabel(2)), "   ");
    await user.click(screen.getByRole("button", { name: text.send(1) }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(api.requestsTo(INVITE_ROUTE)).toHaveLength(1);
    expect(screen.queryByText(identityFr.fields.invalidEmail)).not.toBeInTheDocument();
  });
});
