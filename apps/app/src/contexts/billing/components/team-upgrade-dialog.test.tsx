import type { OrganizationRole } from "@passalio/shared";
import { screen, waitFor, within } from "@testing-library/react";
import type { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { identityFr, TeamScreen } from "@/contexts/identity";
import { fr } from "@/fr";
import {
  errorReply,
  heldReply,
  installFakeApi,
  jsonReply,
  type FakeReply,
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
  SHORT_TRACE_ID,
  signedInRoutes,
  TEAM,
  teamSeenBy,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { billingFr } from "../billing-fr";
import { TeamUpgradeDialog } from "./team-upgrade-dialog";

const text = billingFr.teamUpgrade;
const inviteText = identityFr.invite;

type User = ReturnType<typeof userEvent.setup>;

const PREVIEW_ROUTE = "POST /api/billing/team-upgrade/preview";
const UPGRADE_ROUTE = "POST /api/billing/team-upgrade";
const INVITE_ROUTE = "POST /api/invitations";

const PRORATION_DATE = Date.parse("2026-10-24T10:00:00.000Z") / 1000;

const previewReply = (interval: "month" | "year" = "month") =>
  jsonReply({
    preview: {
      amountDueCents: 1000,
      interval,
      currentPeriodEndsAt: "2026-11-08T10:00:00.000Z",
      prorationDate: PRORATION_DATE,
    },
  });

const installSoloTeam = (role: OrganizationRole = "owner", routes: FakeRoutes = {}) => {
  const plan = { isTeam: false };
  const api = installFakeApi({
    ...signedInRoutes(role),
    [ORGANIZATION_ROUTE]: organizationReply(),
    [MEMBERS_ROUTE]: membersReply(teamSeenBy(role)),
    [INVITATIONS_ROUTE]: invitationsReply([]),
    [INVITE_ROUTE]: (): FakeReply =>
      plan.isTeam
        ? jsonReply({ id: "invitation-2" }, 201)
        : errorReply("team_plan_required", TRACE_ID, 409),
    [PREVIEW_ROUTE]: previewReply(),
    [UPGRADE_ROUTE]: (): FakeReply => {
      plan.isTeam = true;
      return noContentReply();
    },
    ...routes,
  });
  return api;
};

const renderTeam = async () => {
  const rendered = renderScreen(<TeamScreen teamPlanUpgrade={TeamUpgradeDialog} />, {
    path: "/equipe",
  });
  await screen.findByText(TEAM.technician.name);
  return rendered;
};

const inviteTechnician = async (user: User, email = "paul@exemple.fr") => {
  const [inviteButton] = await screen.findAllByRole("button", { name: inviteText.title });
  if (inviteButton === undefined) {
    throw new Error("no invite button");
  }
  await user.click(inviteButton);
  const dialog = await screen.findByRole("dialog", { name: inviteText.title });
  await user.type(within(dialog).getByLabelText(inviteText.emailLabel), email);
  await user.click(within(dialog).getByRole("button", { name: inviteText.submit }));
};

const upgradeDialog = () => screen.findByRole("dialog", { name: text.title });

describe("TeamUpgradeDialog", () => {
  afterEach(forgetToasts);

  it("opens instead of an error when Solo has no technician seat left", async () => {
    installSoloTeam();
    const { user } = await renderTeam();
    await inviteTechnician(user);

    const dialog = await upgradeDialog();
    expect(
      within(dialog).getByText(
        "La formule Solo comprend un technicien, et vous en avez déjà un. Pour inviter paul@exemple.fr comme technicien, passez à Équipe : techniciens illimités.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("dialog", { name: inviteText.title })).not.toBeInTheDocument();
    expect(screen.queryByText(fr.errors.messages.team_plan_required)).not.toBeInTheDocument();
  });

  it("shows the new plan, the prorata to pay today and the next price", async () => {
    installSoloTeam();
    const { user } = await renderTeam();
    await inviteTechnician(user);

    const dialog = await upgradeDialog();
    expect(await within(dialog).findByText("Équipe, 49 € HT par mois")).toBeVisible();
    expect(within(dialog).getByText("10,00 €")).toBeVisible();
    expect(
      within(dialog).getByText(
        "Au prorata des 15 jours qui restent jusqu'au 8 nov. Ensuite 49 € par mois.",
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByText(
        "Vous pouvez aussi l'inviter avec le rôle Secrétariat, inclus dans Solo.",
      ),
    ).toBeVisible();
  });

  it("gives the yearly Équipe price to a yearly subscription", async () => {
    installSoloTeam("owner", { [PREVIEW_ROUTE]: previewReply("year") });
    const { user } = await renderTeam();
    await inviteTechnician(user);

    const dialog = await upgradeDialog();
    expect(await within(dialog).findByText("Équipe, 490 € HT par an")).toBeVisible();
    expect(
      within(dialog).getByText(
        "Au prorata des 15 jours qui restent jusqu'au 8 nov. Ensuite 490 € par an.",
      ),
    ).toBeVisible();
  });

  it("shows the shape of the amount while Stripe computes it, and waits to confirm", async () => {
    const preview = heldReply(previewReply());
    installSoloTeam("owner", { [PREVIEW_ROUTE]: preview.reply });
    const { user } = await renderTeam();
    await inviteTechnician(user);

    const dialog = await upgradeDialog();
    expect(within(dialog).getByLabelText(text.loading)).toHaveAttribute("aria-busy", "true");
    expect(within(dialog).getByRole("button", { name: text.confirm })).toBeDisabled();
    preview.release();
    expect(await within(dialog).findByText("Équipe, 49 € HT par mois")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: text.confirm })).toBeEnabled();
  });

  it("switches to Équipe at the previewed prorata, then sends the invitation", async () => {
    const upgrade = heldReply(noContentReply());
    const api = installSoloTeam();
    const { user } = await renderTeam();
    await inviteTechnician(user);
    const dialog = await upgradeDialog();
    await within(dialog).findByText("Équipe, 49 € HT par mois");
    api.setRoute(UPGRADE_ROUTE, () => {
      api.setRoute(INVITE_ROUTE, jsonReply({ id: "invitation-2" }, 201));
      return upgrade.reply;
    });

    await user.click(within(dialog).getByRole("button", { name: text.confirm }));
    expect(await within(dialog).findByRole("button", { name: text.confirming })).toBeDisabled();
    upgrade.release();

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: text.title })).not.toBeInTheDocument(),
    );
    expect(await screen.findByText(text.upgraded)).toBeInTheDocument();
    expect(await screen.findByText(inviteText.sent("paul@exemple.fr"))).toBeVisible();
    expect(screen.queryByRole("dialog", { name: inviteText.title })).not.toBeInTheDocument();
    expect(api.requestsTo(UPGRADE_ROUTE)[0]?.body).toEqual({ prorationDate: PRORATION_DATE });
    expect(api.requestsTo(INVITE_ROUTE).map(({ body }) => body)).toEqual([
      { email: "paul@exemple.fr", role: "technician" },
      { email: "paul@exemple.fr", role: "technician" },
    ]);
  });

  it("goes back to the invitation, email kept, to choose another role", async () => {
    const api = installSoloTeam();
    const { user } = await renderTeam();
    await inviteTechnician(user);
    const dialog = await upgradeDialog();

    await user.click(within(dialog).getByRole("button", { name: text.cancel }));

    const invite = await screen.findByRole("dialog", { name: inviteText.title });
    expect(within(invite).getByLabelText(inviteText.emailLabel)).toHaveValue("paul@exemple.fr");
    expect(screen.queryByRole("dialog", { name: text.title })).not.toBeInTheDocument();
    expect(api.requestsTo(UPGRADE_ROUTE)).toHaveLength(0);
  });

  it("keeps Solo and explains a refused card with the trace code", async () => {
    const api = installSoloTeam("owner", {
      [UPGRADE_ROUTE]: errorReply("payment_failed", TRACE_ID, 402),
    });
    const { user } = await renderTeam();
    await inviteTechnician(user);
    const dialog = await upgradeDialog();
    await within(dialog).findByText("Équipe, 49 € HT par mois");

    await user.click(within(dialog).getByRole("button", { name: text.confirm }));

    expect(await screen.findByText(fr.errors.messages.payment_failed)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(screen.getByRole("dialog", { name: text.title })).toBeVisible();
    expect(api.requestsTo(INVITE_ROUTE)).toHaveLength(1);
  });

  it("computes the amount again when the preview has expired", async () => {
    const api = installSoloTeam("owner", {
      [UPGRADE_ROUTE]: errorReply("preview_expired", TRACE_ID, 409),
    });
    const { user } = await renderTeam();
    await inviteTechnician(user);
    const dialog = await upgradeDialog();
    await within(dialog).findByText("Équipe, 49 € HT par mois");

    await user.click(within(dialog).getByRole("button", { name: text.confirm }));

    expect(await screen.findByText(fr.errors.messages.preview_expired)).toBeVisible();
    await waitFor(() => expect(api.requestsTo(PREVIEW_ROUTE)).toHaveLength(2));
  });

  it("offers to try again when the amount cannot be computed", async () => {
    const api = installSoloTeam("owner", {
      [PREVIEW_ROUTE]: errorReply("internal", TRACE_ID, 500),
    });
    const { user } = await renderTeam();
    await inviteTechnician(user);
    const dialog = await upgradeDialog();

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent(text.loadFailed);
    expect(alert).toHaveTextContent(fr.errors.code(SHORT_TRACE_ID));
    expect(within(dialog).getByRole("button", { name: text.confirm })).toBeDisabled();
    api.setRoute(PREVIEW_ROUTE, previewReply());
    await user.click(within(dialog).getByRole("button", { name: text.retry }));
    expect(await within(dialog).findByText("Équipe, 49 € HT par mois")).toBeVisible();
  });

  it("tells an admin, who cannot change the plan, to ask for Équipe", async () => {
    const api = installSoloTeam("admin");
    const { user } = await renderTeam();
    await inviteTechnician(user);

    expect(await screen.findByText(fr.errors.messages.team_plan_required)).toBeVisible();
    expect(screen.queryByRole("dialog", { name: text.title })).not.toBeInTheDocument();
    expect(api.requestsTo(PREVIEW_ROUTE)).toHaveLength(0);
  });
});
