import { expect, test } from "@playwright/test";
import { INVITEE_STATE_FILE, loadAdminScreenFixtures } from "./support/admin-screen-fixtures";
import { assignClientIp } from "./support/client-ip";
import { ageTwoFactorVerification, fillTotpCode, openAdminSession } from "./support/platform-admin";
import { inSequence } from "./support/sequence";
import { VIEWPORTS } from "./support/viewports";

const ADMIN_NAVIGATION = "Navigation de l'espace admin";
const CODE_LABEL = "Code à 6 chiffres";
const WRONG_CODE_MESSAGE = "Code incorrect. Vérifiez l'heure de votre téléphone et réessayez.";
const COMMERCIAL_PAGES = [
  { path: "/admin/contacts", heading: "Contacts" },
  { path: "/admin/prospection", heading: "Prospection" },
  { path: "/admin/journee", heading: "Ma journée" },
  { path: "/admin/appels", heading: "Appels" },
] as const;
const COMPANY_PAGES = ["/configuration/entreprise", "/", "/connexion"] as const;

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("a signed-out admin who opens an admin page comes back to it after the password and the code", async ({
      browser,
    }) => {
      const { context, page, member } = await openAdminSession(browser, size, "admin");
      await context.clearCookies();

      await page.goto("/admin/journal");
      await expect(page).toHaveURL(/\/connexion\?retour=/);
      await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
      await page.getByLabel("Adresse email").fill(member.email);
      await page.getByLabel("Mot de passe", { exact: true }).fill(member.password);
      await page.getByRole("button", { name: "Se connecter" }).click();

      await expect(page).toHaveURL(/\/connexion\/code/);
      await expect(page.getByRole("heading", { name: "Code de vérification" })).toBeVisible();
      await fillTotpCode(page, CODE_LABEL, member.secret);
      await page.getByRole("button", { name: "Vérifier" }).click();

      await expect(page).toHaveURL(/\/admin\/journal$/);
      await expect(page.getByRole("heading", { name: "Journal", level: 1 })).toBeVisible();
      await context.close();
    });

    test("a super admin without a company who opens the company setup, the home or the sign-in page is sent to the admin space", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "superadmin");

      await inSequence(COMPANY_PAGES, async (path) => {
        await page.goto(path);
        await expect(page).toHaveURL(/\/admin$/);
        await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();
      });
      await expect(page.getByRole("heading", { name: "Votre entreprise" })).toHaveCount(0);
      await context.close();
    });

    test("a sales member without a company who opens the company setup or the home page lands on the companies", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");

      await inSequence(COMPANY_PAGES, async (path) => {
        await page.goto(path);
        await expect(page).toHaveURL(/\/admin\/entreprises$/);
        await expect(page.getByRole("heading", { name: "Entreprises", level: 1 })).toBeVisible();
      });
      await context.close();
    });

    test("a sales member who types the address of a customer account file is sent back to the companies", async ({
      browser,
    }) => {
      const { accountPath, accountName } = await loadAdminScreenFixtures(browser);
      const { context, page } = await openAdminSession(browser, size, "sales");

      await inSequence([accountPath, `${accountPath}?onglet=journal`], async (path) => {
        await page.goto(path);
        await expect(page).toHaveURL(/\/admin\/entreprises$/);
        await expect(page.getByRole("heading", { name: "Entreprises", level: 1 })).toBeVisible();
      });
      await expect(page.getByRole("heading", { name: accountName })).toHaveCount(0);
      const accounts = await page.request.get("/api/admin/accounts");
      expect(accounts.status()).toBe(403);
      await context.close();
    });

    test("the admin role also works in the Commercial pages", async ({ browser }) => {
      const { context, page } = await openAdminSession(browser, size, "admin");
      const navigation = page.getByRole("navigation", { name: ADMIN_NAVIGATION });

      const commercialLink = navigation.getByRole("link", {
        name: name === "mobile" ? "Commercial" : "Entreprises",
      });

      await expect(commercialLink).toBeVisible();
      await commercialLink.click();
      await expect(page).toHaveURL(/\/admin\/entreprises$/);
      await expect(page.getByRole("heading", { name: "Entreprises", level: 1 })).toBeVisible();
      await expect(page.getByRole("button", { name: "Nouvelle entreprise" })).toBeVisible();
      await inSequence(COMMERCIAL_PAGES, async ({ path, heading }) => {
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
      });
      await context.close();
    });

    test("a wrong code on the 12 hour check is refused and the admin space stays closed", async ({
      browser,
    }) => {
      const { context, page, member } = await openAdminSession(browser, size, "superadmin");
      await ageTwoFactorVerification(member.email, 13);

      await page.goto("/admin/comptes");
      await expect(page).toHaveURL(/\/admin\/code/);
      await expect(page.getByRole("heading", { name: "Code de vérification" })).toBeVisible();
      await page.getByLabel(CODE_LABEL).fill("000000");
      await page.getByRole("button", { name: "Vérifier" }).click();
      await expect(page.getByText(WRONG_CODE_MESSAGE)).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/code/);

      await page.goto("/admin/journal");
      await expect(page).toHaveURL(/\/admin\/code/);
      await expect(page.getByRole("heading", { name: "Journal", level: 1 })).toHaveCount(0);
      const overview = await page.request.get("/api/admin/overview");
      expect(overview.status()).toBe(401);
      await context.close();
    });

    test("an invitation link that does not exist says the invitation is no longer valid", async ({
      browser,
    }) => {
      await loadAdminScreenFixtures(browser);
      const context = await browser.newContext({
        viewport: size,
        storageState: INVITEE_STATE_FILE,
      });
      await assignClientIp(context);
      const page = await context.newPage();

      await page.goto(`/equipe-passalio/invitations/${crypto.randomUUID()}`);
      await expect(
        page.getByRole("heading", { name: "Cette invitation n'est plus valable" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Rejoindre l'équipe" })).toHaveCount(0);
      await context.close();
    });
  });
}
