import { expect, test, type Page } from "@playwright/test";
import { APP_URL } from "../playwright.config";
import { newAccount, signIn, signUpAndOnboardOwner, TEST_PASSWORD } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { emailLinkSentBy } from "./support/email-links";
import { expireResetPasswordLinksOf } from "./support/reset-links";
import { VIEWPORTS } from "./support/viewports";

const SIGN_IN_ATTEMPTS_PER_MINUTE = 10;

const SIGN_UP_ROUTE = "**/api/auth/sign-up/email";

const SIGN_IN_ROUTE = "**/api/auth/sign-in/email";

const OFFLINE_SESSION_KEY = "passalio.offline-session";

const localDatabaseNames = (page: Page) =>
  page.evaluate(async () =>
    (await indexedDB.databases())
      .map(({ name }) => name ?? "")
      .filter((name) => name.startsWith("passalio-")),
  );

const offlineSession = (page: Page) =>
  page.evaluate((key) => localStorage.getItem(key), OFFLINE_SESSION_KEY);

const expectSignInScreen = async (page: Page) => {
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
};

const expectHomeOf = async (page: Page, firstName: string) => {
  await expect(page.getByRole("heading", { name: `Bonjour ${firstName}` })).toBeVisible();
  expect(new URL(page.url()).origin).toBe(APP_URL);
};

const submitSignIn = async (page: Page, password: string) => {
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  const response = page.waitForResponse(SIGN_IN_ROUTE);
  await page.getByRole("button", { name: "Se connecter" }).click();
  return (await response).status();
};

const requestResetLink = (page: Page, email: string) =>
  emailLinkSentBy("password_reset", async () => {
    await page.goto("/mot-de-passe-oublie");
    await expect(page.getByRole("heading", { name: "Mot de passe oublié" })).toBeVisible();
    await page.getByLabel("Adresse email").fill(email);
    await page.getByRole("button", { name: "Recevoir le lien" }).click();
    await expect(page.getByText(/Si un compte existe pour cette adresse/)).toBeVisible();
  });

const expectExpiredResetLink = async (page: Page) => {
  await expect(page).toHaveURL(/\/mot-de-passe\/nouveau/);
  await expect(page.getByRole("alert")).toContainText("Lien expiré");
  await expect(page.getByText("Ce lien n'est plus valable. Demandez-en un nouveau.")).toBeVisible();
  await page.getByRole("link", { name: "Recevoir un nouveau lien" }).click();
  await expect(page).toHaveURL(/\/mot-de-passe-oublie$/);
  await expect(page.getByRole("heading", { name: "Mot de passe oublié" })).toBeVisible();
};

for (const viewport of VIEWPORTS) {
  test.describe(`accounts on ${viewport.name}`, () => {
    test.use({ viewport: viewport.size });

    test.beforeEach(async ({ context }) => {
      await assignClientIp(context);
    });

    test("an account cannot be created without accepting the terms, then is created once they are accepted", async ({
      page,
    }) => {
      const account = newAccount({ firstName: "Claire" });
      const signUpRequests: string[] = [];
      page.on("request", (request) => {
        if (request.url().includes("/api/auth/sign-up/email")) {
          signUpRequests.push(request.method());
        }
      });

      await page.goto("/inscription");
      await expect(page.getByRole("heading", { name: "Créer votre compte" })).toBeVisible();
      await page.getByLabel("Prénom").fill(account.firstName);
      await page.getByLabel("Nom", { exact: true }).fill(account.lastName);
      await page.getByLabel("Adresse email professionnelle").fill(account.email);
      await page.getByLabel("Mot de passe", { exact: true }).fill(account.password);
      await page.getByRole("button", { name: "Créer mon compte" }).click();

      await expect(page.getByText("Acceptez les conditions pour continuer.")).toBeVisible();
      await expect(page).toHaveURL(/\/inscription/);
      expect(signUpRequests).toEqual([]);

      await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).click();
      const created = page.waitForResponse(SIGN_UP_ROUTE);
      await page.getByRole("button", { name: "Créer mon compte" }).click();
      expect((await created).ok()).toBe(true);
      await expect(page).toHaveURL(/\/configuration\/entreprise/);
      await expect(page.getByLabel("Nom affiché sur les documents")).toBeVisible();
    });

    test("an account refused for the terms does not exist and cannot sign in", async ({ page }) => {
      const account = newAccount();
      await page.goto("/inscription");
      await expect(page.getByRole("heading", { name: "Créer votre compte" })).toBeVisible();
      await page.getByLabel("Prénom").fill(account.firstName);
      await page.getByLabel("Nom", { exact: true }).fill(account.lastName);
      await page.getByLabel("Adresse email professionnelle").fill(account.email);
      await page.getByLabel("Mot de passe", { exact: true }).fill(account.password);
      await page.getByRole("button", { name: "Créer mon compte" }).click();
      await expect(page.getByText("Acceptez les conditions pour continuer.")).toBeVisible();

      await signIn(page, account);
      await expect(page.getByText("Adresse email ou mot de passe incorrect.")).toBeVisible();
      await expectSignInScreen(page);
    });

    test("a user signs in with the right password after a wrong one is refused", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Hugo" } });
      await page.context().clearCookies();

      await page.goto("/connexion");
      await expectSignInScreen(page);
      await page.getByLabel("Adresse email").fill(owner.email);
      expect(await submitSignIn(page, "pas-le-bon-mot-de-passe")).toBe(401);
      await expect(page.getByText("Adresse email ou mot de passe incorrect.")).toBeVisible();
      await expectSignInScreen(page);

      expect(await submitSignIn(page, owner.password)).toBe(200);
      await expect(page).toHaveURL(`${APP_URL}/`);
      await expectHomeOf(page, owner.firstName);
    });

    test("too many sign-in attempts are refused, even with the right password", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Inès" } });
      await page.context().clearCookies();
      await page.goto("/connexion");
      await expectSignInScreen(page);
      await page.getByLabel("Adresse email").fill(owner.email);

      const refusedStatuses = await Array.from({ length: SIGN_IN_ATTEMPTS_PER_MINUTE }).reduce<
        Promise<number[]>
      >(async (previous) => {
        const statuses = await previous;
        return [...statuses, await submitSignIn(page, "mauvais-mot-de-passe-2026")];
      }, Promise.resolve([]));
      expect(refusedStatuses).toEqual(
        Array.from({ length: SIGN_IN_ATTEMPTS_PER_MINUTE }, () => 401),
      );

      expect(await submitSignIn(page, owner.password)).toBe(429);
      await expect(
        page.getByText("Trop de tentatives. Patientez une minute puis réessayez.").first(),
      ).toBeVisible();
      await expectSignInScreen(page);
    });

    test("a password reset link cannot be used twice", async ({ page }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Jules" } });
      await page.context().clearCookies();

      const link = await requestResetLink(page, owner.email);
      await page.goto(link);
      await expect(page).toHaveURL(/\/mot-de-passe\/nouveau\?token=/);
      await expect(page.getByRole("heading", { name: "Nouveau mot de passe" })).toBeVisible();
      await page.getByLabel("Nouveau mot de passe", { exact: true }).fill("ramonage-de-printemps");
      await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
      await expect(
        page.getByText("Mot de passe modifié. Connectez-vous avec le nouveau."),
      ).toBeVisible();
      await expectSignInScreen(page);

      await page.goto(link);
      await expectExpiredResetLink(page);

      await signIn(page, { email: owner.email, password: "ramonage-de-printemps" });
      await expectHomeOf(page, owner.firstName);
    });

    test("an expired password reset link is refused and the old password still works", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Karim" } });
      await page.context().clearCookies();

      const link = await requestResetLink(page, owner.email);
      await expireResetPasswordLinksOf(owner.email);
      await page.goto(link);
      await expectExpiredResetLink(page);

      await signIn(page, { email: owner.email, password: TEST_PASSWORD });
      await expectHomeOf(page, owner.firstName);
    });

    test("signing out erases the local database and returns to the sign-in screen", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Léa" } });
      await page.goto("/clients");
      await expect(page.getByText("Ajoutez votre premier client")).toBeVisible();
      await expect.poll(() => localDatabaseNames(page)).not.toEqual([]);
      expect(await offlineSession(page)).not.toBeNull();

      await page.goto("/reglages");
      await expect(page.getByRole("heading", { name: "Réglages" })).toBeVisible();
      await expect(page.getByRole("main").getByText(owner.email)).toBeVisible();
      await page.getByRole("main").getByRole("button", { name: "Se déconnecter" }).click();

      await expectSignInScreen(page);
      await expect.poll(() => localDatabaseNames(page)).toEqual([]);
      expect(await offlineSession(page)).toBeNull();

      await page.goto("/clients");
      await expectSignInScreen(page);
      expect(new URL(page.url()).searchParams.get("retour")).toBe("/clients");
    });

    test("a signed-in user who opens the sign-in or sign-up screen lands on the home screen", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Manon" } });

      await page.goto("/connexion");
      await expect(page).toHaveURL(`${APP_URL}/`);
      await expectHomeOf(page, owner.firstName);

      await page.goto("/inscription");
      await expect(page).toHaveURL(`${APP_URL}/`);
      await expectHomeOf(page, owner.firstName);

      await page.goto("/connexion?retour=%2Fclients");
      await expect(page).toHaveURL(`${APP_URL}/clients`);
    });
  });
}
