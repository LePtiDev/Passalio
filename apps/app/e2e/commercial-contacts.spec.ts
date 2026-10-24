import { expect, test, type Page } from "@playwright/test";
import { openAdminSession } from "./support/platform-admin";
import { addProspectContact, createProspectCompany, uniqueToken } from "./support/prospects";
import { VIEWPORTS } from "./support/viewports";

const contactLinks = (page: Page) => page.getByRole("link", { name: /^Ouvrir / });

const isMainContactChecked = async (page: Page, contactId: string) => {
  await page.goto(`/admin/contacts/${contactId}`);
  await page.getByRole("button", { name: "Modifier" }).click();
  const dialog = page.getByRole("dialog", { name: "Modifier le contact" });
  await expect(dialog).toBeVisible();
  const checkbox = dialog.getByRole("checkbox", { name: "Contact principal" });
  await expect(checkbox).toBeVisible();
  return checkbox.isChecked();
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("the contacts list switches tabs, searches and opens a contact file", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");
      const token = uniqueToken();
      const companyName = `Ramonage Contacts ${token}`;
      const companyId = await createProspectCompany(page, {
        name: companyName,
        department: "93",
        city: "Montreuil",
      });
      await addProspectContact(page, companyId, {
        firstName: "Claire",
        lastName: `Dirigeante${token}`,
        isLeader: true,
        phone: "01 48 00 00 00",
      });
      await addProspectContact(page, companyId, {
        firstName: "Marc",
        lastName: `Secretaire${token}`,
        jobTitle: "Secrétaire",
      });
      const leaderName = `Claire Dirigeante${token}`;
      const otherName = `Marc Secretaire${token}`;

      await page.goto("/admin/contacts");
      await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
      await page.getByLabel("Rechercher un contact").fill(token);
      await expect(page).toHaveURL(new RegExp(`recherche=${token}`));
      await expect(contactLinks(page)).toHaveCount(2);

      const tabs = page.getByRole("tablist", { name: "Contacts" });
      await tabs.getByRole("tab", { name: /^Dirigeants/ }).click();
      await expect(page).toHaveURL(/onglet=leaders/);
      await expect(contactLinks(page)).toHaveText([new RegExp(leaderName)]);

      await tabs.getByRole("tab", { name: /^Sans téléphone/ }).click();
      await expect(page).toHaveURL(/onglet=no_phone/);
      await expect(contactLinks(page)).toHaveText([new RegExp(otherName)]);

      await tabs.getByRole("tab", { name: /^Tous/ }).click();
      await expect(contactLinks(page)).toHaveCount(2);

      await page.getByLabel("Rechercher un contact").fill(`absent${token}`);
      await expect(page.getByText(`Aucun contact pour « absent${token} »`)).toBeVisible();
      await page.getByLabel("Rechercher un contact").fill(`Dirigeante${token}`);
      await expect(contactLinks(page)).toHaveCount(1);

      await page.getByRole("link", { name: `Ouvrir ${leaderName}` }).click();
      await expect(page).toHaveURL(/\/admin\/contacts\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name: leaderName, level: 1 })).toBeVisible();
      await expect(
        page.getByText("01 48 00 00 00").filter({ visible: true }).first(),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: companyName }).first()).toBeVisible();
      await context.close();
    });

    test("a company keeps a single main contact when another one is marked as main", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");
      const token = uniqueToken();
      const companyName = `Ramonage Principal ${token}`;
      const companyId = await createProspectCompany(page, { name: companyName, department: "92" });
      const firstId = await addProspectContact(page, companyId, {
        firstName: "Anne",
        lastName: `Premiere${token}`,
        isMain: true,
      });
      const secondName = `Bruno Second${token}`;

      await page.goto(`/admin/entreprises/${companyId}`);
      await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();
      await page
        .getByRole("button", { name: /^Ajouter( un contact)?$/ })
        .first()
        .click();
      const dialog = page.getByRole("dialog", { name: "Nouveau contact" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Ajouter le contact" }).click();
      await expect(dialog.getByText("Indiquez le nom de la personne.")).toBeVisible();
      await dialog.getByLabel("Prénom").fill("Bruno");
      await dialog.getByLabel("Nom", { exact: true }).fill(`Second${token}`);
      await dialog.getByRole("checkbox", { name: "Contact principal" }).check();
      await dialog.getByRole("button", { name: "Ajouter le contact" }).click();
      await expect(page.getByText(`${secondName} est ajouté.`)).toBeVisible();
      await expect(page.getByRole("link", { name: `Ouvrir ${secondName}` })).toBeVisible();

      await page.getByRole("link", { name: `Ouvrir ${secondName}` }).click();
      await expect(page.getByRole("heading", { name: secondName, level: 1 })).toBeVisible();
      const secondId = page.url().split("/").at(-1) ?? "";

      expect(await isMainContactChecked(page, secondId)).toBe(true);
      expect(await isMainContactChecked(page, firstId)).toBe(false);
      await context.close();
    });
  });
}
