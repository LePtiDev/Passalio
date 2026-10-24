import { expect, type Page } from "@playwright/test";

export const TEST_PASSWORD = "cheminee-propre-2026";

export const uniqueEmail = (prefix = "patron") =>
  `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}@example.fr`;

export type NewAccount = {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
};

export const newAccount = (overrides: Partial<NewAccount> = {}): NewAccount => ({
  firstName: "Jean",
  lastName: "Dupont",
  email: uniqueEmail(),
  password: TEST_PASSWORD,
  ...overrides,
});

export const fillSignUpForm = async (page: Page, account: NewAccount) => {
  await expect(page).toHaveURL(/\/inscription/);
  await expect(page.getByRole("heading", { name: "Créer votre compte" })).toBeVisible();
  await page.getByLabel("Prénom").fill(account.firstName);
  await page.getByLabel("Nom", { exact: true }).fill(account.lastName);
  await page.getByLabel("Adresse email professionnelle").fill(account.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(account.password);
  await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
};

export const signUp = async (page: Page, account: NewAccount = newAccount()) => {
  await page.goto("/connexion");
  await expect(page.getByRole("link", { name: "Créer un compte" })).toBeVisible();
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await fillSignUpForm(page, account);
  return account;
};

export const signIn = async (
  page: Page,
  { email, password }: Pick<NewAccount, "email" | "password">,
) => {
  await page.goto("/connexion");
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
};

export type OnboardingOptions = {
  readonly account?: Partial<NewAccount>;
  readonly companyName?: string;
  readonly siret?: string;
  readonly trades?: readonly string[];
};

export const DEFAULT_TRADES = ["Ramonage", "Pompe à chaleur et climatisation"] as const;

export const signUpAndOnboardOwner = async (page: Page, options: OnboardingOptions = {}) => {
  const account = await signUp(page, newAccount(options.account));
  const companyName = options.companyName ?? "Ramonage Dupont";

  await expect(page).toHaveURL(/\/configuration\/entreprise/);
  await expect(page.getByLabel("Nom affiché sur les documents")).toBeVisible();
  await page.getByLabel("Nom affiché sur les documents").fill(companyName);
  await page.getByLabel("SIRET").fill(options.siret ?? "123 456 789 00012");
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page).toHaveURL(/\/configuration\/metiers/);
  await (options.trades ?? DEFAULT_TRADES).reduce(async (previous, trade) => {
    await previous;
    await page.getByText(trade, { exact: true }).click();
  }, Promise.resolve());
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page).toHaveURL(/\/configuration\/documents/);
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page).toHaveURL(/\/configuration\/equipe/);
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page.getByRole("heading", { name: `Bonjour ${account.firstName}` })).toBeVisible();

  return { ...account, companyName };
};
