import { expect, test, type Page } from "@playwright/test";
import { APP_URL } from "../playwright.config";
import { newAccount, signUpAndOnboardOwner } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { emailLinkSentBy } from "./support/email-links";
import {
  FAKE_SHORT_TRACE_ID,
  SHORT_TRACE_CODE,
  failWithServerError,
  holdResponses,
} from "./support/server-responses";
import { VIEWPORTS } from "./support/viewports";

const SIGN_IN_ROUTE = "**/api/auth/sign-in/email";

const SIGN_UP_ROUTE = "**/api/auth/sign-up/email";

const RESET_PASSWORD_ROUTE = "**/api/auth/reset-password";

const toastWith = (page: Page, message: string) =>
  page.getByRole("listitem").filter({ hasText: message });

const expectToastWithTraceCode = async (page: Page, message: string) => {
  const toast = toastWith(page, message);
  await expect(toast).toBeVisible();
  await expect(toast.getByText(SHORT_TRACE_CODE)).toBeVisible();
};

const openSignIn = async (page: Page, path = "/connexion") => {
  await page.goto(path);
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
};

const openSignUp = async (page: Page) => {
  await page.goto("/inscription");
  await expect(page.getByRole("heading", { name: "Créer votre compte" })).toBeVisible();
};

const fillSignIn = async (page: Page, email: string, password: string) => {
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
};

const recordRequests = (page: Page, path: string) => {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes(path)) {
      urls.push(request.url());
    }
  });
  return urls;
};

for (const viewport of VIEWPORTS) {
  test.describe(`account errors on ${viewport.name}`, () => {
    test.use({ viewport: viewport.size });

    test.beforeEach(async ({ context }) => {
      await assignClientIp(context);
    });

    test("a refused password shows its message with a short trace code", async ({ page }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Pauline" } });
      await page.context().clearCookies();

      await openSignIn(page);
      await fillSignIn(page, owner.email, "pas-le-bon-mot-de-passe");
      await page.getByRole("button", { name: "Se connecter" }).click();

      await expectToastWithTraceCode(page, "Adresse email ou mot de passe incorrect.");
      await expect(page).toHaveURL(/\/connexion/);
    });

    test("a sign-in that fails on the server shows a generic error with its trace code", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Quentin" } });
      await page.context().clearCookies();
      await failWithServerError(page, SIGN_IN_ROUTE, "POST");

      await openSignIn(page);
      await fillSignIn(page, owner.email, owner.password);
      await page.getByRole("button", { name: "Se connecter" }).click();

      const toast = toastWith(page, "Une erreur est survenue. Réessayez dans un instant.");
      await expect(toast).toBeVisible();
      await expect(toast.getByText(`Code : ${FAKE_SHORT_TRACE_ID}`)).toBeVisible();
      await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    });

    test("the sign-in button shows the sign-in is in progress until the server answers", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Rose" } });
      await page.context().clearCookies();
      const release = await holdResponses(page, SIGN_IN_ROUTE, "POST");

      await openSignIn(page);
      await fillSignIn(page, owner.email, owner.password);
      await page.getByRole("button", { name: "Se connecter" }).click();

      const pending = page.getByRole("button", { name: "Connexion…" });
      await expect(pending).toBeVisible();
      await expect(pending).toBeDisabled();

      release();
      await expect(page.getByRole("heading", { name: `Bonjour ${owner.firstName}` })).toBeVisible();
      await expect(page).toHaveURL(`${APP_URL}/`);
    });

    test("signing in from a protected page returns to that page", async ({ page }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Simon" } });
      await page.context().clearCookies();

      await page.goto("/clients");
      await expect(page).toHaveURL(/\/connexion\?retour=%2Fclients/);
      await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
      await fillSignIn(page, owner.email, owner.password);
      await page.getByRole("button", { name: "Se connecter" }).click();

      await expect(page).toHaveURL(`${APP_URL}/clients`);
      await expect(page.getByText("Ajoutez votre premier client")).toBeVisible();
    });

    test("a signed-in user who opens the forgot password screen lands on the home screen", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Thomas" } });

      await page.goto("/mot-de-passe-oublie");
      await expect(page).toHaveURL(`${APP_URL}/`);
      await expect(page.getByRole("heading", { name: `Bonjour ${owner.firstName}` })).toBeVisible();
    });

    test("signing up with an address that already has an account is refused with a trace code", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Ugo" } });
      await page.context().clearCookies();

      await openSignUp(page);
      await page.getByLabel("Prénom").fill("Autre");
      await page.getByLabel("Nom", { exact: true }).fill("Personne");
      await page.getByLabel("Adresse email professionnelle").fill(owner.email);
      await page.getByLabel("Mot de passe", { exact: true }).fill("un-autre-mot-de-passe-2026");
      await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).click();
      const response = page.waitForResponse(SIGN_UP_ROUTE);
      await page.getByRole("button", { name: "Créer mon compte" }).click();
      expect((await response).ok()).toBe(false);

      await expectToastWithTraceCode(
        page,
        "Un compte existe déjà avec cette adresse. Connectez-vous.",
      );
      await expect(page).toHaveURL(/\/inscription/);

      await openSignIn(page);
      await fillSignIn(page, owner.email, "un-autre-mot-de-passe-2026");
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(toastWith(page, "Adresse email ou mot de passe incorrect.")).toBeVisible();
    });

    test("a password shorter than 12 characters is refused at sign-up without calling the server", async ({
      page,
    }) => {
      const account = newAccount({ password: "court-11car" });
      const signUpRequests = recordRequests(page, "/api/auth/sign-up/email");

      await openSignUp(page);
      await page.getByLabel("Prénom").fill(account.firstName);
      await page.getByLabel("Nom", { exact: true }).fill(account.lastName);
      await page.getByLabel("Adresse email professionnelle").fill(account.email);
      await page.getByLabel("Mot de passe", { exact: true }).fill(account.password);
      await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).click();
      await page.getByRole("button", { name: "Créer mon compte" }).click();

      await expect(page.getByLabel("Mot de passe", { exact: true })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(page).toHaveURL(/\/inscription/);
      expect(signUpRequests).toEqual([]);
    });

    test("a new password shorter than 12 characters is refused and the link stays usable", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { account: { firstName: "Valentin" } });
      await page.context().clearCookies();
      const resetRequests = recordRequests(page, "/api/auth/reset-password");

      const link = await emailLinkSentBy("password_reset", async () => {
        await page.goto("/mot-de-passe-oublie");
        await expect(page.getByRole("heading", { name: "Mot de passe oublié" })).toBeVisible();
        await page.getByLabel("Adresse email").fill(owner.email);
        await page.getByRole("button", { name: "Recevoir le lien" }).click();
        await expect(page.getByText(/Si un compte existe pour cette adresse/)).toBeVisible();
      });
      await page.goto(link);
      await expect(page.getByRole("heading", { name: "Nouveau mot de passe" })).toBeVisible();
      const newPassword = page.getByLabel("Nouveau mot de passe", { exact: true });
      await newPassword.fill("trop-court");
      await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();

      await expect(newPassword).toHaveAttribute("aria-invalid", "true");
      expect(resetRequests.filter((url) => !url.includes("/reset-password/"))).toEqual([]);

      await newPassword.fill("ramonage-d-automne-2026");
      const saved = page.waitForResponse(RESET_PASSWORD_ROUTE);
      await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
      expect((await saved).ok()).toBe(true);
      await expect(
        page.getByText("Mot de passe modifié. Connectez-vous avec le nouveau."),
      ).toBeVisible();
    });
  });
}
