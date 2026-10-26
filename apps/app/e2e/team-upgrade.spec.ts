import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousAccessibilityViolations } from "./support/accessibility";
import { signUpAndOnboardOwner } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { expectTouchTargetsAtLeast48px } from "./support/touch-targets";
import { MOBILE, VIEWPORTS } from "./support/viewports";

const DAY_MS = 24 * 60 * 60 * 1000;

const UPGRADE_DIALOG = "Passer à la formule Équipe ?";

const TECHNICIAN_ROLES: ReadonlySet<string> = new Set(["technician", "admin"]);

const stubSoloPlan = async (page: Page) => {
  const plan: { isTeam: boolean; upgradeBody: unknown } = { isTeam: false, upgradeBody: null };
  const previewedAt = Math.floor(Date.now() / 1000);
  await page.route("**/api/invitations", async (route) => {
    const isTechnicianInvite =
      route.request().method() === "POST" &&
      TECHNICIAN_ROLES.has(String(route.request().postDataJSON()?.role));
    if (!isTechnicianInvite || plan.isTeam) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 409,
      json: { error: "team_plan_required", traceId: "e2e-solo-seat" },
    });
  });
  await page.route("**/api/billing/team-upgrade/preview", (route) =>
    route.fulfill({
      json: {
        preview: {
          amountDueCents: 1000,
          interval: "month",
          currentPeriodEndsAt: new Date(previewedAt * 1000 + 15 * DAY_MS).toISOString(),
          prorationDate: previewedAt,
        },
      },
    }),
  );
  await page.route(/\/api\/billing\/team-upgrade$/u, async (route) => {
    plan.upgradeBody = route.request().postDataJSON();
    plan.isTeam = true;
    await route.fulfill({ status: 204 });
  });
  return plan;
};

const inviteTechnician = async (page: Page, email: string) => {
  await page.getByRole("button", { name: "Inviter une personne" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Inviter une personne" });
  await dialog.getByLabel("Adresse email").fill(email);
  await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();
};

test.beforeEach(async ({ context }) => {
  await assignClientIp(context);
});

for (const { name, size } of VIEWPORTS) {
  test.describe(`the Équipe upgrade on ${name}`, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 120_000 });

    test("a Solo owner sees the prorata, switches to Équipe and invites the technician", async ({
      page,
    }) => {
      await signUpAndOnboardOwner(page, { companyName: "Ramonage Solo" });
      const plan = await stubSoloPlan(page);
      await page.goto("/equipe");

      await inviteTechnician(page, "paul.martin@exemple.fr");

      const dialog = page.getByRole("dialog", { name: UPGRADE_DIALOG });
      await expect(dialog.getByText("Équipe, 49 € HT par mois")).toBeVisible();
      await expect(dialog.getByText(/^10,00\s€$/u)).toBeVisible();
      await expect(dialog.getByText(/^Au prorata des 15 jours qui restent/u)).toBeVisible();
      await expectNoSeriousAccessibilityViolations(page);
      if (size.width === MOBILE.width) {
        await expectTouchTargetsAtLeast48px(page);
      }

      await dialog.getByRole("button", { name: "Passer à Équipe et inviter" }).click();

      await expect(
        page.getByText("Invitation envoyée à paul.martin@exemple.fr. Elle est valable 7 jours."),
      ).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(plan.upgradeBody).toEqual({ prorationDate: expect.any(Number) });
    });
  });
}

test("a Solo owner can go back and invite a secretary instead", async ({ page }) => {
  await signUpAndOnboardOwner(page, { companyName: "Ramonage Secrétariat" });
  const plan = await stubSoloPlan(page);
  await page.goto("/equipe");

  await inviteTechnician(page, "lea@exemple.fr");
  await page
    .getByRole("dialog", { name: UPGRADE_DIALOG })
    .getByRole("button", { name: "Annuler" })
    .click();

  const invite = page.getByRole("dialog", { name: "Inviter une personne" });
  await expect(invite.getByLabel("Adresse email")).toHaveValue("lea@exemple.fr");
  await invite.getByRole("combobox", { name: "Rôle" }).click();
  await page.getByRole("option", { name: "Secrétariat" }).click();
  await invite.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(
    page.getByText("Invitation envoyée à lea@exemple.fr. Elle est valable 7 jours."),
  ).toBeVisible();
  expect(plan.upgradeBody).toBeNull();
});
