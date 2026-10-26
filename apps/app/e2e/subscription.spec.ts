import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousAccessibilityViolations } from "./support/accessibility";
import { signUpAndOnboardOwner } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { expectTouchTargetsAtLeast48px } from "./support/touch-targets";
import { DESKTOP, MOBILE, VIEWPORTS } from "./support/viewports";

const DAY_MS = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString();

const trial = {
  workspaceState: "trial",
  blockedReason: null,
  trialEndsAt: inDays(3),
  graceEndsAt: null,
  isBillingEnabled: true,
  canManage: true,
  subscription: null,
};

const soloMonthly = {
  plan: "solo",
  interval: "month",
  isFounder: false,
  currentPeriodEndsAt: inDays(30),
  isCancelScheduled: false,
  paymentMethod: { type: "card", last4: "4242" },
};

const stubBilling = async (page: Page, subscription: () => unknown) => {
  await page.route("**/api/billing/subscription", (route) =>
    route.fulfill({ json: { subscription: subscription() } }),
  );
  await page.route("**/api/billing/invoices", (route) =>
    route.fulfill({
      json: {
        invoices: [
          {
            id: "in_1",
            number: "PASSALIO-0001",
            issuedAt: new Date().toISOString(),
            totalCents: 2900,
            status: "paid",
            pdfUrl: "https://pay.stripe.com/invoice/in_1/pdf",
          },
        ],
      },
    }),
  );
};

test.beforeEach(async ({ context }) => {
  await assignClientIp(context);
});

test.describe("subscription while online payment is closed", () => {
  test.use({ viewport: DESKTOP });

  test("the owner sees the plans, the coming payment and an open space", async ({ page }) => {
    await signUpAndOnboardOwner(page, { companyName: "Ramonage Abonnement" });
    await page.getByRole("complementary").getByRole("link", { name: "Abonnement" }).click();

    await expect(page).toHaveURL(/\/reglages\/abonnement$/);
    await expect(page.getByRole("heading", { name: "Abonnement", level: 1 })).toBeVisible();
    await expect(page.getByText("Le paiement en ligne arrive bientôt")).toBeVisible();
    await expect(page.getByRole("button", { name: "Choisir Solo" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Choisir Équipe" })).toBeDisabled();
    await expect(page.getByText("Conseillé : vous avez 1 technicien")).toBeVisible();
    await expect(page.getByRole("complementary").getByText("Essai gratuit")).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
    await expect(page.getByText("Votre essai se termine")).toHaveCount(0);
  });
});

test.describe("subscription with online payment", () => {
  test.use({ viewport: DESKTOP });

  test("the owner chooses Équipe yearly, pays on Stripe and comes back welcomed", async ({
    page,
  }) => {
    await signUpAndOnboardOwner(page, { companyName: "Ramonage Abonnement" });
    let current: unknown = trial;
    await stubBilling(page, () => current);
    let checkoutBody: unknown;
    await page.route("**/api/billing/checkout", async (route) => {
      checkoutBody = route.request().postDataJSON();
      current = { ...trial, workspaceState: "active", subscription: soloMonthly };
      await route.fulfill({
        json: { url: new URL("/reglages/abonnement?paiement=ok", page.url()).toString() },
      });
    });

    await page.goto("/");
    const banner = page
      .getByRole("status")
      .filter({ hasText: "Votre essai se termine dans 3 jours." });
    await expect(banner).toBeVisible();
    await banner.getByRole("link", { name: "Choisir ma formule" }).click();

    await expect(page).toHaveURL(/\/reglages\/abonnement$/);
    await expect(page.getByText("Encore 3 jours")).toBeVisible();
    await page.getByText("Annuel", { exact: true }).click();
    await expect(page.getByText("490 €", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Choisir Équipe" }).click();

    await expect(page.getByText("Bienvenue ! Votre formule Solo est active.")).toBeVisible();
    await expect(page).toHaveURL(/\/reglages\/abonnement$/);
    expect(checkoutBody).toEqual({ plan: "team", interval: "year" });
    await expect(page.getByRole("heading", { name: "Solo, paiement mensuel" })).toBeVisible();
    await expect(page.getByText("PASSALIO-0001")).toBeVisible();
    await expect(page.getByRole("complementary").getByText("Formule Solo")).toBeVisible();
  });

  test("a blocked owner only sees the plans and can still sign out", async ({ page }) => {
    await signUpAndOnboardOwner(page, { companyName: "Ramonage Bloqué" });
    await stubBilling(page, () => ({
      ...trial,
      workspaceState: "blocked",
      blockedReason: "trial_ended",
      trialEndsAt: inDays(-1),
    }));

    await page.goto("/clients");

    await expect(
      page.getByRole("heading", { name: "Votre essai de 7 jours est terminé" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Choisir Solo" })).toBeEnabled();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/connexion/);
  });
});

for (const { name, size } of VIEWPORTS) {
  test.describe(`subscription screens on ${name}`, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 120_000 });

    test("the trial, subscribed and blocked screens have no serious accessibility violation", async ({
      page,
    }) => {
      await signUpAndOnboardOwner(page, { companyName: "Ramonage Accessible" });
      let current: unknown = trial;
      await stubBilling(page, () => current);
      const states = [
        { state: trial, path: "/reglages/abonnement", heading: "Essai gratuit" },
        {
          state: { ...trial, workspaceState: "active", subscription: soloMonthly },
          path: "/reglages/abonnement",
          heading: "Solo, paiement mensuel",
        },
        {
          state: {
            ...trial,
            workspaceState: "payment_failed",
            graceEndsAt: inDays(10),
            subscription: soloMonthly,
          },
          path: "/",
          heading: "Bonjour",
        },
        {
          state: { ...trial, workspaceState: "blocked", blockedReason: "trial_ended" },
          path: "/",
          heading: "Votre essai de 7 jours est terminé",
        },
      ];
      await states.reduce(async (previous, { state, path, heading }) => {
        await previous;
        current = state;
        await page.goto(path);
        await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
        await expectNoSeriousAccessibilityViolations(page);
        if (size.width === MOBILE.width) {
          await expectTouchTargetsAtLeast48px(page);
        }
      }, Promise.resolve());
    });
  });
}
