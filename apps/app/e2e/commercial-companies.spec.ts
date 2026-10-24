import { expect, test, type Page } from "@playwright/test";
import { openAdminSession } from "./support/platform-admin";
import {
  addProspectContact,
  changeProspectStage,
  createProspectCompany,
  uniqueToken,
} from "./support/prospects";
import { inSequence } from "./support/sequence";
import { MOBILE, VIEWPORTS } from "./support/viewports";

const IDF_DEPARTMENTS = ["75", "77", "78", "91", "92", "93", "94", "95"] as const;

const companyLinks = (page: Page) => page.getByRole("link", { name: /^Ouvrir / });

const searchCompanies = async (page: Page, search: string) => {
  await page.getByLabel("Rechercher une entreprise").fill(search);
  await expect.poll(() => new URL(page.url()).searchParams.get("recherche")).toBe(search);
};

const isMobile = (page: Page) => page.viewportSize()?.width === MOBILE.width;

const pickDepartmentFilter = async (page: Page, typed: string, option: string) => {
  await page.getByRole("button", { name: "Filtres" }).click();
  if (isMobile(page)) {
    const drawer = page.getByRole("dialog", { name: "Filtres" });
    await drawer.getByRole("button", { name: /^Département/ }).click();
    await expect(page.getByRole("heading", { name: "Département" })).toBeVisible();
  } else {
    await page.getByRole("menuitem", { name: /^Département/ }).click();
  }
  const search = page.getByPlaceholder("Rechercher : département");
  await expect(search).toBeFocused();
  await search.fill(typed);
  await expect(page.getByRole("option", { name: option })).toBeVisible();
  await expect(page.getByRole("option", { name: "Paris (75)" })).toHaveCount(0);
  await page.getByRole("option", { name: option }).click();
  if (isMobile(page)) {
    await page.getByRole("button", { name: "Voir les résultats" }).click();
  }
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("the companies list filters by stage tab, by department typed in the cascade menu and by search", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");
      const token = uniqueToken();
      await Promise.all(
        IDF_DEPARTMENTS.map((department) =>
          createProspectCompany(page, {
            name: `Ramoneur ${token} ${department}`,
            department,
            city: `Ville ${department}`,
          }),
        ),
      );
      const interestedId = await createProspectCompany(page, {
        name: `Ramoneur ${token} interessee`,
        department: "94",
        city: "Créteil",
      });
      await changeProspectStage(page, interestedId, "interested");

      await page.goto("/admin/entreprises");
      await expect(page.getByRole("heading", { name: "Entreprises" })).toBeVisible();
      await searchCompanies(page, token);
      await expect(page.getByRole("link", { name: `Ouvrir Ramoneur ${token} 75` })).toBeVisible();

      const tabs = page.getByRole("tablist", { name: "Étapes" });
      await tabs.getByRole("tab", { name: /^Intéressées/ }).click();
      await expect(page).toHaveURL(/etape=interested/);
      await expect(tabs.getByRole("tab", { name: /^Intéressées/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(companyLinks(page)).toHaveText([new RegExp(`Ramoneur ${token} interessee`)]);

      await tabs.getByRole("tab", { name: /^Toutes/ }).click();
      await expect(page).not.toHaveURL(/etape=/);
      await expect(page.getByRole("link", { name: `Ouvrir Ramoneur ${token} 75` })).toBeVisible();

      await pickDepartmentFilter(page, "94", "Val-de-Marne (94)");
      await expect(page).toHaveURL(/departement=(%22)?94(%22)?(&|$)/);
      await expect(page.getByRole("button", { name: "Filtres, 1 actif" })).toBeVisible();
      await expect(
        page.getByText("Val-de-Marne (94)").filter({ visible: true }).first(),
      ).toBeVisible();
      await expect(companyLinks(page)).toHaveCount(2);
      await expect(page.getByRole("link", { name: `Ouvrir Ramoneur ${token} 94` })).toBeVisible();

      await page.getByRole("button", { name: "Retirer le filtre Département" }).click();
      await expect(page).not.toHaveURL(/departement=/);
      await expect(page.getByRole("link", { name: `Ouvrir Ramoneur ${token} 75` })).toBeVisible();

      await searchCompanies(page, `${token} 77`);
      await expect(companyLinks(page)).toHaveText([new RegExp(`Ramoneur ${token} 77`)]);

      await searchCompanies(page, `absent${token}`);
      await expect(page.getByText(`Aucune entreprise pour « absent${token} »`)).toBeVisible();
      await page.getByRole("button", { name: "Effacer la recherche" }).click();
      await expect(page.getByLabel("Rechercher une entreprise")).toHaveValue("");
      await context.close();
    });

    test("the companies list pages through the results with the next and previous buttons", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");
      const token = uniqueToken();
      const total = 25;
      await Promise.all(
        Array.from({ length: total }, (_, index) =>
          createProspectCompany(page, {
            name: `Ramoneur ${token} ${String(index + 1).padStart(2, "0")}`,
            department: "2A",
          }),
        ),
      );

      await page.goto(`/admin/entreprises?recherche=${token}`);
      await expect(companyLinks(page).first()).toBeVisible();
      const pagination = page.getByRole("navigation", { name: "Pagination" });
      const next = pagination.getByRole("button", { name: "Page suivante" });
      const previous = pagination.getByRole("button", { name: "Page précédente" });
      await expect(previous).toBeDisabled();
      await expect(next).toBeEnabled();

      const firstPage = await companyLinks(page).allInnerTexts();
      const pageSize = firstPage.length;
      await expect(pagination.getByText(`1–${pageSize}`, { exact: true })).toBeVisible();
      const otherPages = Array.from(
        { length: Math.ceil(total / pageSize) - 1 },
        (_, index) => index + 1,
      );
      const seen = new Set(firstPage);
      await inSequence(otherPages, async (pageIndex) => {
        await next.click();
        const first = pageIndex * pageSize + 1;
        const last = Math.min(total, first + pageSize - 1);
        await expect(pagination.getByText(`${first}–${last}`, { exact: true })).toBeVisible();
        await expect(previous).toBeEnabled();
        const rows = await companyLinks(page).allInnerTexts();
        rows.forEach((row) => seen.add(row));
      });
      await expect(next).toBeDisabled();
      expect(seen.size).toBe(total);

      await previous.click();
      await expect(next).toBeEnabled();
      await context.close();
    });

    test("a sales member creates, edits and deletes a prospect company", async ({ browser }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");
      const token = uniqueToken();
      const companyName = `Ramonage Nouveau ${token}`;
      await page.goto("/admin/entreprises");
      await expect(page.getByRole("heading", { name: "Entreprises" })).toBeVisible();

      await page.getByRole("button", { name: "Nouvelle entreprise" }).click();
      const dialog = page.getByRole("dialog", { name: "Nouvelle entreprise" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Créer l'entreprise" }).click();
      await expect(dialog.getByText("Indiquez le nom de l'entreprise.")).toBeVisible();
      await expect(
        dialog.getByText("Indiquez un département valide, par exemple 94."),
      ).toBeVisible();

      await dialog.getByLabel("Nom", { exact: true }).fill(companyName);
      await dialog.getByLabel("Code postal").fill("940");
      await dialog.getByLabel("Département").fill("94");
      await dialog.getByRole("button", { name: "Créer l'entreprise" }).click();
      await expect(dialog.getByText("Le code postal fait 5 chiffres.")).toBeVisible();
      await dialog.getByLabel("Code postal").fill("94000");
      await dialog.getByLabel("Ville").fill("Créteil");
      await dialog.getByLabel("Téléphone").fill("01 43 00 00 00");
      await dialog.getByRole("button", { name: "Créer l'entreprise" }).click();

      await expect(page.getByText(`${companyName} est ajoutée.`)).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/entreprises\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();
      await expect(page.getByText("Créteil").filter({ visible: true }).first()).toBeVisible();

      await page.getByRole("button", { name: "Modifier" }).click();
      const editDialog = page.getByRole("dialog", { name: "Modifier l'entreprise" });
      await expect(editDialog.getByLabel("Nom", { exact: true })).toHaveValue(companyName);
      await editDialog.getByLabel("Ville").fill("Vincennes");
      await editDialog.getByLabel("Outil actuel").fill("Carnet et Word");
      await editDialog.getByRole("button", { name: "Enregistrer" }).click();
      await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
      await expect(editDialog).toHaveCount(0);
      await expect(page.getByText("Vincennes").filter({ visible: true }).first()).toBeVisible();
      await expect(
        page.getByText("Carnet et Word").filter({ visible: true }).first(),
      ).toBeVisible();

      await page.getByRole("button", { name: "Modifier" }).click();
      await page
        .getByRole("dialog", { name: "Modifier l'entreprise" })
        .getByRole("button", { name: "Supprimer l'entreprise" })
        .click();
      const confirm = page.getByRole("alertdialog", { name: `Supprimer ${companyName} ?` });
      await expect(
        confirm.getByText(
          "La fiche, ses contacts et son historique seront supprimés définitivement.",
        ),
      ).toBeVisible();
      await confirm.getByRole("button", { name: "Supprimer l'entreprise" }).click();

      await expect(page.getByText(`${companyName} est supprimée.`)).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/entreprises$/);
      await searchCompanies(page, token);
      await expect(page.getByText(`Aucune entreprise pour « ${token} »`)).toBeVisible();
      await context.close();
    });

    test("a sales member changes the stage and adds a note that both appear in the history", async ({
      browser,
    }) => {
      const { context, page, member } = await openAdminSession(browser, size, "sales", {
        firstName: "Antho",
        lastName: "Vendeur",
      });
      const companyName = `Ramonage Suivi ${uniqueToken()}`;
      const companyId = await createProspectCompany(page, {
        name: companyName,
        department: "94",
        city: "Créteil",
      });
      await addProspectContact(page, companyId, {
        firstName: "Paul",
        lastName: "Martin",
        isMain: true,
      });

      await page.goto(`/admin/entreprises/${companyId}`);
      await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();
      await expect(page.getByText("Aucune note pour l'instant.")).toBeVisible();

      await page.getByRole("button", { name: "Changer l'étape" }).click();
      await expect(page.getByRole("menuitemradio", { name: "À qualifier" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await page.getByRole("menuitemradio", { name: "Intéressée", exact: true }).click();
      await expect(page.getByText(`${companyName} est intéressée.`)).toBeVisible();
      await expect(page.getByText("Étape passée à Intéressée.")).toBeVisible();

      await page.getByLabel("Ajouter une note").fill("Rappeler mardi après 14 h.");
      await page.getByRole("button", { name: "Ajouter", exact: true }).last().click();
      await expect(page.getByText("Note ajoutée.")).toBeVisible();
      await expect(page.getByLabel("Ajouter une note")).toHaveValue("");

      const history = page.getByRole("list").filter({ hasText: "Étape passée à Intéressée." });
      await expect(history.getByRole("listitem")).toHaveCount(2);
      await expect(history.getByRole("listitem").first()).toContainText(
        "Rappeler mardi après 14 h.",
      );
      await expect(history.getByRole("listitem").first()).toContainText(
        `${member.firstName} ${member.lastName}`,
      );
      await expect(history.getByRole("listitem").last()).toContainText(
        "Étape passée à Intéressée.",
      );

      await page.reload();
      await expect(page.getByText("Rappeler mardi après 14 h.")).toBeVisible();
      await expect(page.getByText("Étape passée à Intéressée.")).toBeVisible();
      await context.close();
    });
  });
}
