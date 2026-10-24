import { expect, test } from "@playwright/test";
import { editCustomerField, goToCustomerList, openNewSite } from "./support/customer-screens";
import {
  createIndividualCustomer,
  customerNameOf,
  expectOnServer,
  expectUpToDate,
  fillManualAddress,
  newIndividualCustomer,
  PENDING_BANNER,
  serverCustomerFile,
  syncIndicator,
  visible,
} from "./support/customers";
import { addInsert } from "./support/equipments";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  goOffline,
  goOnline,
  onboardFieldOwner,
} from "./support/field-context";
import {
  expectPendingCountAbove,
  failSyncRoute,
  holdSyncPush,
  SYNC_PUSH_ROUTE,
} from "./support/sync-control";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 2 });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("edits, a new site, a new equipment and its removal made without network all reach the server when the network is back", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expectUpToDate(page);

      await goOffline(page);
      await expect(syncIndicator(page, /^Hors ligne$/)).toBeVisible();
      await editCustomerField(page, "Email", "hors-ligne@exemple.fr");
      const afterEdit = await expectPendingCountAbove(page, 0);

      await openNewSite(page);
      await page.getByLabel("Nom du lieu").fill("Résidence secondaire");
      await fillManualAddress(page, {
        address: "9 chemin des Vignes",
        postalCode: "94350",
        city: "Villiers-sur-Marne",
      });
      await page.getByRole("button", { name: "Ajouter le lieu" }).click();
      await expect(page.getByText("Lieu ajouté.")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Résidence secondaire" })).toBeVisible();
      const afterSite = await expectPendingCountAbove(page, afterEdit);

      await addInsert(page);
      await expect(visible(page, "Insert bois · Invicta")).toBeVisible();
      const afterEquipment = await expectPendingCountAbove(page, afterSite);

      await page.getByRole("button", { name: "Actions sur l'appareil" }).click();
      await page.getByRole("menuitem", { name: "Retirer" }).click();
      const dialog = page.getByRole("alertdialog", { name: "Retirer Insert bois · Invicta ?" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Retirer" }).click();
      await expect(page.getByText("Appareil retiré. Il reste dans l'historique.")).toBeVisible();
      await expectPendingCountAbove(page, afterEquipment);

      const beforeSync = await serverCustomerFile(context.request, customerId);
      expect(beforeSync?.customer.email ?? null).toBeNull();
      expect(beforeSync?.sites).toHaveLength(1);
      expect(beforeSync?.equipments).toEqual([]);

      await goToCustomerList(page);
      await expect(page.getByText(PENDING_BANNER)).toBeVisible();
      await expect(
        page.getByRole("link", { name: new RegExp(customerNameOf(customer)) }),
      ).toContainText("À envoyer");

      await goOnline(page);
      await expectUpToDate(page);
      await expect(page.getByText(PENDING_BANNER)).toBeHidden();
      await expect(
        page.getByRole("link", { name: new RegExp(customerNameOf(customer)) }),
      ).not.toContainText("À envoyer");
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored, sites, equipments }) =>
          stored.email === "hors-ligne@exemple.fr" &&
          sites.length === 2 &&
          sites.some(
            ({ label, city }) => label === "Résidence secondaire" && city === "Villiers-sur-Marne",
          ) &&
          equipments.length === 1 &&
          equipments.every(({ kind, status }) => kind === "insert" && status === "removed"),
      );
      await context.close();
    });

    test("a change waiting for the server is shown as pending while online, then up to date", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expectUpToDate(page);

      const push = await holdSyncPush(context);
      await editCustomerField(page, "Téléphone", "07 44 55 66 77");
      await expect(syncIndicator(page, /\b1 à envoyer$/)).toBeVisible();
      await expect(syncIndicator(page, /à jour/i)).toBeHidden();
      const stale = await serverCustomerFile(context.request, customerId);
      expect(stale?.customer.phone?.replaceAll(" ", "")).toBe("0698765432");

      await push.release();
      await expectUpToDate(page);
      await expect(syncIndicator(page, /à envoyer$/)).toBeHidden();
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored }) => stored.phone?.replaceAll(" ", "") === "0744556677",
      );
      await context.close();
    });

    test("a failing synchronization is shown and the change stays pending until it succeeds", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expectUpToDate(page);

      await failSyncRoute(context, SYNC_PUSH_ROUTE);
      await editCustomerField(page, "Email", "echec@exemple.fr");
      await expect(syncIndicator(page, "Synchronisation en échec")).toBeVisible({
        timeout: 15_000,
      });
      const stale = await serverCustomerFile(context.request, customerId);
      expect(stale?.customer.email ?? null).toBeNull();

      await context.unroute(SYNC_PUSH_ROUTE);
      await goOffline(page);
      await goOnline(page);
      await expectUpToDate(page);
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored }) => stored.email === "echec@exemple.fr",
      );
      await context.close();
    });
  });
}
