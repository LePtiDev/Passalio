import { expect, type Browser, type Page } from "@playwright/test";
import { newAccount, signUp, type NewAccount } from "./accounts";
import { assignClientIp } from "./client-ip";

const expectStep = async (page: Page, path: RegExp, title: string) => {
  await expect(page).toHaveURL(path);
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
};

export const onboardCustomerOwner = async (
  page: Page,
  companyName: string,
  overrides: Partial<NewAccount> = {},
) => {
  const account = await signUp(page, newAccount(overrides));

  await expectStep(page, /\/configuration\/entreprise/, "Votre entreprise");
  await page.getByLabel("Nom affiché sur les documents").fill(companyName);
  await page.getByLabel("SIRET").fill("123 456 789 00012");
  await page.getByRole("button", { name: "Continuer" }).click();

  await expectStep(page, /\/configuration\/metiers/, "Vos métiers");
  await page.getByText("Ramonage", { exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();

  await expectStep(page, /\/configuration\/documents/, "Vos documents");
  await page.getByRole("button", { name: "Continuer" }).click();

  await expectStep(page, /\/configuration\/equipe/, "Invitez votre équipe");
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page.getByRole("heading", { name: `Bonjour ${account.firstName}` })).toBeVisible();
  return { ...account, companyName };
};

export const onboardCustomerInNewContext = async (
  browser: Browser,
  companyName: string,
  overrides: Partial<NewAccount> = {},
) => {
  const context = await browser.newContext();
  await assignClientIp(context);
  const owner = await onboardCustomerOwner(await context.newPage(), companyName, overrides);
  await context.close();
  return owner;
};
