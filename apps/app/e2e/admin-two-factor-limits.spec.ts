import { expect, test, type Page } from "@playwright/test";
import { newAccount, signUp } from "./support/accounts";
import { assignClientIp, uniqueClientIp } from "./support/client-ip";
import {
  fillTotpCode,
  grantPlatformRole,
  openAdminSession,
  signInWithCode,
  startTwoFactorSetup,
} from "./support/platform-admin";
import { inSequence } from "./support/sequence";
import { VIEWPORTS } from "./support/viewports";

const CODE_LABEL = "Code à 6 chiffres";
const WRONG_CODE_MESSAGE = "Code incorrect. Vérifiez l'heure de votre téléphone et réessayez.";
const TOO_MANY_ATTEMPTS = /Trop d'essais|Trop de tentatives/;
const ALLOWED_ATTEMPTS = [1, 2, 3, 4, 5] as const;

const submitWrongCode = async (page: Page) => {
  await page.getByLabel(CODE_LABEL).fill("000000");
  const verified = page.waitForResponse((response) =>
    response.url().includes("/api/auth/two-factor/verify"),
  );
  await page.getByRole("button", { name: "Vérifier" }).click();
  return (await verified).status();
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("a sixth code within a minute is refused even when it is right", async ({ browser }) => {
      const { context, page, member } = await openAdminSession(browser, size, "admin");
      await context.clearCookies();
      const ip = uniqueClientIp();
      await page.route("**/api/**", (route) =>
        route.continue({ headers: { ...route.request().headers(), "cf-connecting-ip": ip } }),
      );

      await signInWithCode(page, member);
      await inSequence(ALLOWED_ATTEMPTS, async () => {
        expect(await submitWrongCode(page)).not.toBe(429);
        await expect(page.getByText(WRONG_CODE_MESSAGE)).toBeVisible();
      });

      await submitWrongCode(page);
      await expect(page.getByText(TOO_MANY_ATTEMPTS).first()).toBeVisible();
      await fillTotpCode(page, CODE_LABEL, member.secret);
      const rightCodeVerified = page.waitForResponse((response) =>
        response.url().includes("/api/auth/two-factor/verify"),
      );
      await page.getByRole("button", { name: "Vérifier" }).click();
      expect((await rightCodeVerified).ok()).toBe(false);
      await expect(page.getByText(TOO_MANY_ATTEMPTS).first()).toBeVisible();
      await expect(page).toHaveURL(/\/connexion\/code/);
      const overview = await page.request.get("/api/admin/overview");
      expect(overview.ok()).toBe(false);
      await context.close();
    });

    test("the backup codes can be copied in one go", async ({ browser }) => {
      const context = await browser.newContext({
        viewport: size,
        permissions: ["clipboard-read", "clipboard-write"],
      });
      await assignClientIp(context);
      const page = await context.newPage();
      const account = await signUp(page, newAccount());
      await expect(page).toHaveURL(/\/configuration\/entreprise/);
      await grantPlatformRole(account.email, "admin");
      await page.goto("/admin");
      const secret = await startTwoFactorSetup(page, account.password);
      await fillTotpCode(page, "2. Saisissez le code à 6 chiffres", secret);
      await page.getByRole("button", { name: "Activer" }).click();

      const codes = page.getByRole("list", { name: "Codes de secours" }).getByRole("listitem");
      await expect(codes).toHaveCount(10);
      const shownCodes = await codes.allInnerTexts();
      await page.getByRole("button", { name: "Copier les codes" }).click();
      await expect(page.getByText("Codes copiés.")).toBeVisible();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      shownCodes.forEach((code) => expect(copied).toContain(code.trim()));
      await context.close();
    });
  });
}
