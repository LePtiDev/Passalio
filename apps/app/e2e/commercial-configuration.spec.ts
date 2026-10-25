import { expect, test, type Page } from "@playwright/test";
import * as z from "zod";
import { openAdminSession } from "./support/platform-admin";
import { MOBILE, VIEWPORTS } from "./support/viewports";

const isMobile = (page: Page) => page.viewportSize()?.width === MOBILE.width;

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Enregistrer", exact: true }).locator("visible=true");

const userIdOf = async (page: Page) =>
  z
    .object({ admin: z.object({ userId: z.string() }) })
    .parse(await (await page.request.get("/api/admin/me")).json()).admin.userId;

const openConfiguration = async (page: Page) => {
  await page.goto("/admin/journee");
  await (
    isMobile(page)
      ? page.getByRole("link", { name: "Configuration", exact: true })
      : page.getByRole("link", { name: /^Configuration de / })
  ).click();
  await expect(page).toHaveURL(/\/admin\/configuration/);
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("a salesperson connects the mailbox, tests it and sets where reminders go", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");
      await openConfiguration(page);
      await expect(page.getByRole("region", { name: "Aucune boîte" })).toBeVisible();

      await page.getByRole("combobox", { name: "Fournisseur" }).click();
      await page.getByRole("option", { name: "OVH Email Pro" }).click();
      await expect(page.getByLabel("Serveur d'envoi")).toHaveValue("pro1.mail.ovh.net");
      await page.getByLabel("Identifiant").fill("commercial@passalio.fr");
      await saveButton(page).click();
      await expect(page.getByText("Champ obligatoire.")).toBeVisible();

      await page.getByLabel("Mot de passe d'application").fill("mot-de-passe-application");
      await saveButton(page).click();
      await expect(page.getByText("Configuration enregistrée.")).toBeVisible();
      await expect(page.getByRole("region", { name: "Boîte à tester" })).toBeVisible();

      await page.getByRole("button", { name: "Tester la connexion" }).click();
      await expect(page.getByRole("region", { name: "Boîte connectée" })).toBeVisible();
      await expect(page.getByText(/Connexion réussie/)).toBeVisible();

      await page.getByRole("link", { name: "Rappels", exact: true }).click();
      await page.getByLabel("Adresse des rappels").fill("rappels@passalio.fr");
      await saveButton(page).click();
      await expect(page.getByText("Configuration enregistrée.").first()).toBeVisible();

      await page.reload();
      await expect(page.getByLabel("Adresse des rappels")).toHaveValue("rappels@passalio.fr");
      await page.getByRole("link", { name: "Boîte mail", exact: true }).click();
      await expect(page.getByLabel("Mot de passe d'application")).toHaveValue("");
      await expect(page.getByRole("region", { name: "Boîte connectée" })).toBeVisible();
      await context.close();
    });

    test("an admin edits a salesperson's mailbox and is told the member will be notified", async ({
      browser,
    }) => {
      const sales = await openAdminSession(browser, size, "sales", {
        firstName: "Antho",
        lastName: "Martin",
      });
      const anthoId = await userIdOf(sales.page);
      const admin = await openAdminSession(browser, size, "superadmin");

      await admin.page.goto(`/admin/configuration?membre=${anthoId}`);
      await expect(
        admin.page.getByText("Vous modifiez la configuration de Antho Martin."),
      ).toBeVisible();
      await admin.page.getByLabel("Nom affiché").fill("Antho, Passalio");
      await admin.page.getByLabel("Mot de passe d'application").fill("mot-de-passe-application");
      await saveButton(admin.page).click();
      await expect(admin.page.getByText("Configuration enregistrée.")).toBeVisible();

      await openConfiguration(sales.page);
      await expect(sales.page.getByLabel("Nom affiché")).toHaveValue("Antho, Passalio");
      await expect(sales.page.getByText("Vous modifiez la configuration")).toHaveCount(0);
      await expect(sales.page.getByRole("combobox", { name: "Membre" })).toHaveCount(0);
      await admin.context.close();
      await sales.context.close();
    });
  });
}
