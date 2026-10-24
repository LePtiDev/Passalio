import { expect, test } from "@playwright/test";
import { expectNoSeriousAccessibilityViolations } from "./support/accessibility";
import { newAccount, signUp } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import {
  ageTwoFactorVerification,
  fillTotpCode,
  grantPlatformRole,
  openAdminSession,
  signInWithCode,
  startTwoFactorSetup,
} from "./support/platform-admin";
import { VIEWPORTS } from "./support/viewports";

const CODE_LABEL = "Code à 6 chiffres";
const WRONG_CODE_MESSAGE = "Code incorrect. Vérifiez l'heure de votre téléphone et réessayez.";

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("a new platform admin activates two-factor with the password, the QR code and backup codes", async ({
      page,
    }) => {
      await assignClientIp(page.context());
      const account = await signUp(page, newAccount({ firstName: "Quentin" }));
      await expect(page).toHaveURL(/\/configuration\/entreprise/);
      await grantPlatformRole(account.email, "superadmin");

      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin\/securite/);
      await expect(
        page.getByRole("heading", { name: "Activez la double authentification" }),
      ).toBeVisible();
      await expectNoSeriousAccessibilityViolations(page);

      await page.getByRole("button", { name: "Continuer" }).click();
      await expect(page.getByText("Saisissez votre mot de passe.")).toBeVisible();
      await page.getByLabel("Confirmez votre mot de passe").fill("pas-le-bon-mot-de-passe");
      await page.getByRole("button", { name: "Continuer" }).click();
      await expect(page.getByText("Mot de passe incorrect.")).toBeVisible();

      const secret = await startTwoFactorSetup(page, account.password);
      await expectNoSeriousAccessibilityViolations(page);
      await page.getByLabel("2. Saisissez le code à 6 chiffres").fill("000000");
      await page.getByRole("button", { name: "Activer" }).click();
      await expect(page.getByText(WRONG_CODE_MESSAGE)).toBeVisible();

      await fillTotpCode(page, "2. Saisissez le code à 6 chiffres", secret);
      await page.getByRole("button", { name: "Activer" }).click();
      await expect(page.getByRole("heading", { name: "Notez vos codes de secours" })).toBeVisible();
      const codes = page.getByRole("list", { name: "Codes de secours" }).getByRole("listitem");
      await expect(codes).toHaveCount(10);
      expect(new Set(await codes.allInnerTexts()).size).toBe(10);
      await expect(page.getByRole("button", { name: "Copier les codes" })).toBeVisible();
      await expectNoSeriousAccessibilityViolations(page);

      await page.getByRole("button", { name: "J'ai noté mes codes" }).click();
      await expect(page.getByText("Double authentification activée.")).toBeVisible();
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();
    });

    test("a platform admin signs in with the password then the authenticator code", async ({
      browser,
    }) => {
      const { context, page, member } = await openAdminSession(browser, size, "superadmin");
      await context.clearCookies();

      await signInWithCode(page, member);
      await expectNoSeriousAccessibilityViolations(page);
      await page.getByRole("button", { name: "Vérifier" }).click();
      await expect(page.getByText("Saisissez le code.")).toBeVisible();
      await fillTotpCode(page, CODE_LABEL, member.secret);
      await page.getByRole("button", { name: "Vérifier" }).click();

      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();
      await context.close();
    });

    test("a wrong authenticator code is refused and the admin space stays closed", async ({
      browser,
    }) => {
      const { context, page, member } = await openAdminSession(browser, size, "admin");
      await context.clearCookies();

      await signInWithCode(page, member);
      await page.getByLabel(CODE_LABEL).fill("000000");
      await page.getByRole("button", { name: "Vérifier" }).click();
      await expect(page.getByText(WRONG_CODE_MESSAGE)).toBeVisible();
      await expect(page).toHaveURL(/\/connexion\/code/);

      await page.goto("/admin");
      await expect(page).toHaveURL(/\/connexion/);
      await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toHaveCount(0);
      await context.close();
    });

    test("a backup code opens the admin space once and cannot be used again", async ({
      browser,
    }) => {
      const { context, page, member } = await openAdminSession(browser, size, "superadmin");
      const [backupCode] = member.backupCodes;
      expect(backupCode).toBeDefined();
      await context.clearCookies();

      await signInWithCode(page, member);
      await page.getByRole("button", { name: "Utiliser un code de secours" }).click();
      await expect(page.getByLabel("Code de secours")).toBeVisible();
      await expect(
        page.getByText("Un des 10 codes notés à l'activation. Chaque code ne sert qu'une fois."),
      ).toBeVisible();
      await page.getByLabel("Code de secours").fill(backupCode ?? "");
      await page.getByRole("button", { name: "Vérifier" }).click();
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();

      await context.clearCookies();
      await signInWithCode(page, member);
      await page.getByRole("button", { name: "Utiliser un code de secours" }).click();
      await expect(page.getByLabel("Code de secours")).toBeVisible();
      await page.getByLabel("Code de secours").fill(backupCode ?? "");
      await page.getByRole("button", { name: "Vérifier" }).click();
      await expect(page.getByText(WRONG_CODE_MESSAGE)).toBeVisible();
      await expect(page).toHaveURL(/\/connexion\/code/);
      await context.close();
    });

    test("an admin session verified more than 12 hours ago asks for the code again", async ({
      browser,
    }) => {
      const { context, page, member } = await openAdminSession(browser, size, "superadmin");
      await page.goto("/admin/comptes");
      await expect(page.getByRole("heading", { name: "Comptes clients" })).toBeVisible();

      await ageTwoFactorVerification(member.email, 13);
      await page.reload();

      await expect(page).toHaveURL(/\/admin\/code/);
      await expect(page.getByRole("heading", { name: "Code de vérification" })).toBeVisible();
      await expect(
        page.getByText("L'espace admin redemande votre code toutes les 12 heures."),
      ).toBeVisible();
      await expectNoSeriousAccessibilityViolations(page);
      await fillTotpCode(page, CODE_LABEL, member.secret);
      await page.getByRole("button", { name: "Vérifier" }).click();

      await expect(page).toHaveURL(/\/admin\/comptes/);
      await expect(page.getByRole("heading", { name: "Comptes clients" })).toBeVisible();
      await context.close();
    });

    test("an admin session verified less than 12 hours ago does not ask for the code", async ({
      browser,
    }) => {
      const { context, page, member } = await openAdminSession(browser, size, "superadmin");
      await ageTwoFactorVerification(member.email, 11);
      await page.goto("/admin/comptes");

      await expect(page.getByRole("heading", { name: "Comptes clients" })).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/comptes/);
      await context.close();
    });
  });
}
