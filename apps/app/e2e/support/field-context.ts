import { expect, type Browser, type Page, type ViewportSize } from "@playwright/test";
import { DEFAULT_TRADES, newAccount, signIn, signUp, type NewAccount } from "./accounts";
import { assignClientIp } from "./client-ip";
import { stubAddressSearch } from "./customers";

export const FIELD_JOURNEY_TIMEOUT_MS = 120_000;

export const openFieldContext = async (browser: Browser, viewport: ViewportSize) => {
  const context = await browser.newContext({ viewport });
  await assignClientIp(context);
  await stubAddressSearch(context);
  return context;
};

export const openCustomerList = async (page: Page) => {
  await page.goto("/clients");
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
};

const expectOnboardingStep = async (page: Page, path: RegExp, heading: string) => {
  await expect(page).toHaveURL(path);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
};

export type FieldOwnerOptions = {
  readonly account?: Partial<NewAccount>;
  readonly trades?: readonly string[];
};

export const onboardOwner = async (page: Page, options: FieldOwnerOptions = {}) => {
  const account = await signUp(page, newAccount(options.account));
  await expectOnboardingStep(page, /\/configuration\/entreprise/, "Votre entreprise");
  await page.getByLabel("Nom affiché sur les documents").fill("Ramonage Dupont");
  await page.getByLabel("SIRET").fill("123 456 789 00012");
  await page.getByRole("button", { name: "Continuer" }).click();

  await expectOnboardingStep(page, /\/configuration\/metiers/, "Vos métiers");
  await (options.trades ?? DEFAULT_TRADES).reduce(async (previous, trade) => {
    await previous;
    await page.getByText(trade, { exact: true }).click();
  }, Promise.resolve());
  await page.getByRole("button", { name: "Continuer" }).click();

  await expectOnboardingStep(page, /\/configuration\/documents/, "Vos documents");
  await page.getByRole("button", { name: "Continuer" }).click();

  await expectOnboardingStep(page, /\/configuration\/equipe/, "Invitez votre équipe");
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page.getByRole("heading", { name: `Bonjour ${account.firstName}` })).toBeVisible();
  return account;
};

export const onboardFieldOwner = async (
  browser: Browser,
  viewport: ViewportSize,
  options: FieldOwnerOptions = {},
) => {
  const context = await openFieldContext(browser, viewport);
  const page = await context.newPage();
  const owner = await onboardOwner(page, options);
  return { context, page, owner };
};

export const signInOnSecondDevice = async (
  browser: Browser,
  viewport: ViewportSize,
  account: Pick<NewAccount, "email" | "password" | "firstName">,
) => {
  const context = await openFieldContext(browser, viewport);
  const page = await context.newPage();
  await signIn(page, account);
  await expect(page.getByRole("heading", { name: `Bonjour ${account.firstName}` })).toBeVisible();
  return { context, page };
};

export const newCustomerLink = (page: Page) =>
  page.getByRole("link", { name: "Nouveau client" }).filter({ visible: true }).first();

export const goOffline = async (page: Page) => {
  await page.context().setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
};

export const goOnline = async (page: Page) => {
  await page.context().setOffline(false);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
};
