import { expect, test } from "@playwright/test";
import { openAdminSession } from "./support/platform-admin";
import { blockMapTiles, createProspectCompany, uniqueToken } from "./support/prospects";
import { VIEWPORTS } from "./support/viewports";

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("a sales member qualifies a company from the map without leaving it", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");
      await blockMapTiles(context);
      const token = uniqueToken();
      const companyName = `Ramonage Carte ${token}`;
      await createProspectCompany(page, {
        name: companyName,
        department: "94",
        city: "Créteil",
        postalCode: "94000",
        latitude: 48.7904,
        longitude: 2.4556,
        phone: "01 42 00 00 00",
      });
      const rejectedName = `Ramonage Refus ${token}`;
      await createProspectCompany(page, {
        name: rejectedName,
        department: "94",
        city: "Vitry-sur-Seine",
        latitude: 48.7875,
        longitude: 2.3928,
      });

      await page.goto(`/admin/prospection?recherche=${token}`);
      await expect(page.getByRole("heading", { name: "Prospection" })).toBeVisible();
      const selected = page.getByRole("region", { name: "Entreprise sélectionnée" });
      await expect(selected).toBeVisible();
      await expect(selected.getByText(/^Ramonage (Carte|Refus) /).first()).toBeVisible();

      await page.goto(`/admin/prospection?recherche=Carte ${token}`);
      await expect(selected.getByText(companyName, { exact: true }).first()).toBeVisible();
      await selected.getByRole("button", { name: "Qualifiée" }).click();
      await expect(page.getByText(`${companyName} est qualifiée.`)).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/prospection/);
      await expect(
        page
          .getByText(`Aucune entreprise pour « Carte ${token} »`)
          .filter({ visible: true })
          .first(),
      ).toBeVisible();

      await page.goto(`/admin/prospection?etape=qualified&recherche=Carte ${token}`);
      await expect(selected.getByText(companyName, { exact: true }).first()).toBeVisible();
      await expect(selected.getByRole("button", { name: "Qualifiée" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      await page.goto(`/admin/prospection?recherche=Refus ${token}`);
      await expect(selected.getByText(rejectedName, { exact: true }).first()).toBeVisible();
      await selected.getByRole("button", { name: "Pas intéressée" }).click();
      await expect(page.getByText(`${rejectedName} n'est pas intéressée.`)).toBeVisible();

      await page.goto(`/admin/prospection?etape=not_interested&recherche=Refus ${token}`);
      await expect(selected.getByRole("button", { name: "Pas intéressée" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await selected.getByRole("link", { name: "Ouvrir la fiche" }).click();
      await expect(page).toHaveURL(/\/admin\/entreprises\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name: rejectedName, level: 1 })).toBeVisible();
      await context.close();
    });
  });
}

test.describe("on desktop", () => {
  test.use({ viewport: VIEWPORTS[1].size });

  test("the prospection list selects a company and switches between the stage tabs", async ({
    browser,
  }) => {
    const { context, page } = await openAdminSession(browser, VIEWPORTS[1].size, "sales");
    await blockMapTiles(context);
    const token = uniqueToken();
    const firstName = `Ramonage Liste A ${token}`;
    const secondName = `Ramonage Liste B ${token}`;
    await Promise.all(
      [firstName, secondName].map((companyName) =>
        createProspectCompany(page, {
          name: companyName,
          department: "77",
          city: "Meaux",
          latitude: 48.96,
          longitude: 2.88,
        }),
      ),
    );

    await page.goto(`/admin/prospection?recherche=${token}`);
    const selected = page.getByRole("region", { name: "Entreprise sélectionnée" });
    await page.getByRole("button", { name: `Afficher ${secondName} sur la carte` }).click();
    await expect(page).toHaveURL(/entreprise=[0-9a-f-]{36}/);
    await expect(
      page.getByRole("button", { name: `Afficher ${secondName} sur la carte` }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(selected.getByText(secondName, { exact: true }).first()).toBeVisible();

    await selected.getByRole("button", { name: "Qualifiée" }).click();
    await expect(page.getByText(`${secondName} est qualifiée.`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: `Afficher ${secondName} sur la carte` }),
    ).toHaveCount(0);
    await expect(selected.getByText(firstName, { exact: true }).first()).toBeVisible();

    const tabs = page.getByRole("tablist", { name: "Étapes" });
    await tabs.getByRole("tab", { name: /^Qualifiées/ }).click();
    await expect(page).toHaveURL(/etape=qualified/);
    await expect(
      page.getByRole("button", { name: `Afficher ${secondName} sur la carte` }),
    ).toBeVisible();
    await context.close();
  });
});
