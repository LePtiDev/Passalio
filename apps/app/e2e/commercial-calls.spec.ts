import { expect, test, type Page } from "@playwright/test";
import { openAdminSession } from "./support/platform-admin";
import { addProspectContact, createProspectCompany, uniqueToken } from "./support/prospects";
import { MOBILE, VIEWPORTS } from "./support/viewports";

const DEPARTMENTS = {
  mobile: { code: "48", label: "Lozère (48)" },
  desktop: { code: "23", label: "Creuse (23)" },
} as const;

const isMobile = (page: Page) => page.viewportSize()?.width === MOBILE.width;

const pickChoice = async (page: Page, label: string, option: string) => {
  if (isMobile(page)) {
    await page.getByRole("combobox", { name: label }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
    return;
  }
  await page
    .getByRole("group", { name: label })
    .getByRole("button", { name: option, exact: true })
    .click();
};

const parisToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

const createCompanyWithContact = async (
  page: Page,
  name: string,
  department: string,
  lastName: string,
) => {
  const companyId = await createProspectCompany(page, {
    name,
    department,
    city: "Mende",
    phone: "04 66 00 00 00",
  });
  await addProspectContact(page, companyId, {
    firstName: "Marc",
    lastName,
    phone: "06 12 34 56 78",
    isMain: true,
  });
  return companyId;
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("a series of calls logs each result, and the promised callback shows up in the day until it is done", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");
      const token = uniqueToken();
      const department = DEPARTMENTS[name];
      await createCompanyWithContact(page, `A ${token} Ramonage`, department.code, `Alpha${token}`);
      await createCompanyWithContact(
        page,
        `B ${token} Fumisterie`,
        department.code,
        `Beta${token}`,
      );

      await page.goto("/admin/appels");
      const volume = page.getByRole("region", { name: "Appeler en volume" });
      await volume.getByRole("spinbutton", { name: "Nombre" }).fill("5");
      await volume.getByRole("combobox", { name: "Zone" }).click();
      await page.getByRole("option", { name: department.label }).click();
      await volume.getByRole("button", { name: "Lancer la série de 5" }).click();

      await expect(page.getByRole("heading", { name: `Marc Alpha${token}` })).toBeVisible();
      await expect(page.getByRole("link", { name: "Appeler le 06 12 34 56 78" })).toHaveAttribute(
        "href",
        "tel:0612345678",
      );
      await pickChoice(page, "Résultat", "Décroché");
      await pickChoice(page, "Intérêt", "Chaud");
      await pickChoice(page, "Prochaine action", "Rappel");
      await page.getByLabel("Date").fill(parisToday());
      await page.getByLabel("Heure").fill("23:45");
      await page.getByLabel("Notes").fill("Rappeler ce soir");
      await page.getByRole("button", { name: "Enregistrer et suivant" }).click();
      await expect(page.getByText("Appel enregistré.")).toBeVisible();

      await expect(page.getByRole("heading", { name: `Marc Beta${token}` })).toBeVisible();
      await pickChoice(page, "Résultat", "Messagerie");
      await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Série terminée" })).toBeVisible();
      await expect(page.getByText("2 appels notés. 1 joint · 1 messagerie.")).toBeVisible();

      await page
        .getByRole("region", { name: "Série terminée" })
        .getByRole("link", { name: "Ma journée" })
        .click();
      const todo = page.getByRole("region", { name: "À faire maintenant" });
      const callback = todo.getByRole("link", { name: new RegExp(`Marc Alpha${token}`) });
      await expect(callback).toBeVisible();
      await callback.click();

      await expect(page.getByRole("heading", { name: `Marc Alpha${token}` })).toBeVisible();
      await expect(page.getByRole("region", { name: "Historique" })).toContainText(
        "Rappeler ce soir",
      );
      await pickChoice(page, "Résultat", "Pas de réponse");
      await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Série terminée" })).toBeVisible();

      await page
        .getByRole("region", { name: "Série terminée" })
        .getByRole("link", { name: "Ma journée" })
        .click();
      await expect(page.getByRole("region", { name: "À faire maintenant" })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(`Marc Alpha${token}`) })).toHaveCount(
        0,
      );
      await context.close();
    });
  });
}
