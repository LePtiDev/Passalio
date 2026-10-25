import { expect, test, type Page } from "@playwright/test";
import { newAccount, signIn, signUp } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { openAdminSession } from "./support/platform-admin";
import { MOBILE, VIEWPORTS } from "./support/viewports";

const SIGN_UP_SETTINGS = "/api/admin/settings/sign-up";

const openSettings = async (page: Page) => {
  await page.goto("/admin");
  if (page.viewportSize()?.width === MOBILE.width) {
    await page.getByRole("link", { name: "Ouvrir les réglages" }).click();
  } else {
    await page
      .getByRole("navigation", { name: "Navigation de l'espace admin" })
      .getByRole("link", { name: "Réglages" })
      .click();
  }
  await expect(page).toHaveURL(/\/admin\/reglages$/);
  return page.getByRole("switch", { name: "Autoriser les inscriptions" });
};

const reopenSignUp = async (page: Page) => {
  const response = await page.request.put(SIGN_UP_SETTINGS, { data: { isSignUpOpen: true } });
  expect(response.ok()).toBe(true);
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 90_000 });

    test("a super admin closes sign-up, existing accounts still sign in, then reopens it", async ({
      browser,
    }) => {
      const visitorContext = await browser.newContext({ viewport: size });
      await assignClientIp(visitorContext);
      const visitor = await visitorContext.newPage();
      const existing = await signUp(visitor, newAccount({ firstName: "Déjà" }));
      await expect(visitor).toHaveURL(/\/configuration\/entreprise/);
      await visitorContext.clearCookies();

      const superadmin = await openAdminSession(browser, size, "superadmin");
      try {
        const signUpSwitch = await openSettings(superadmin.page);
        await expect(signUpSwitch).toBeChecked();

        await signUpSwitch.click();
        const dialog = superadmin.page.getByRole("alertdialog", {
          name: "Fermer les inscriptions en local ?",
        });
        await expect(dialog).toBeVisible();
        await dialog.getByRole("button", { name: "Fermer les inscriptions" }).click();
        await expect(superadmin.page.getByText("Inscriptions fermées.")).toBeVisible();
        await expect(signUpSwitch).not.toBeChecked();

        await visitor.goto("/inscription");
        await expect(
          visitor.getByRole("heading", { name: "Les inscriptions sont fermées pour le moment" }),
        ).toBeVisible();
        await expect(visitor.getByRole("button", { name: "Créer mon compte" })).toHaveCount(0);

        await visitor.getByRole("link", { name: "Se connecter" }).click();
        await signIn(visitor, existing);
        await expect(visitor).toHaveURL(/\/configuration\/entreprise/);

        await superadmin.page.reload();
        await expect(signUpSwitch).not.toBeChecked();
        await signUpSwitch.click();
        await expect(superadmin.page.getByText("Inscriptions ouvertes.")).toBeVisible();
        await expect(signUpSwitch).toBeChecked();

        const newcomerContext = await browser.newContext({ viewport: size });
        const newcomer = await newcomerContext.newPage();
        await newcomer.goto("/inscription");
        await expect(newcomer.getByRole("heading", { name: "Créer votre compte" })).toBeVisible();
        await newcomerContext.close();
      } finally {
        await reopenSignUp(superadmin.page);
        await superadmin.context.close();
        await visitorContext.close();
      }
    });
  });
}
