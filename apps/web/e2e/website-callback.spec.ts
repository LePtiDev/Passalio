import { expect, test, type Page } from "@playwright/test";

const ENDPOINT = "**/api/public/callback-requests";
const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/**";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-expose-headers": "x-trace-id",
};
const PASSING_TURNSTILE = `window.turnstile = {
  render: (container, options) => { setTimeout(() => options.callback("jeton-e2e"), 0); return "widget"; },
  reset: () => undefined,
};`;

const fillValidForm = async (page: Page) => {
  await page.getByLabel("Prénom").fill("Julien");
  await page.getByLabel("Entreprise").fill("Ramonage Martin");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06.12.34.56.78");
  await page.getByLabel("Code postal").fill("94100");
  await page.getByLabel("Moment").selectOption("afternoon");
};

const submit = (page: Page) =>
  page.getByRole("button", { name: "Être rappelé", exact: true }).click();

test.beforeEach(async ({ page }) => {
  await page.route(TURNSTILE_SCRIPT, (route) =>
    route.fulfill({ contentType: "text/javascript", body: PASSING_TURNSTILE }),
  );
  await page.goto("/sans-reseau");
});

test("marks the postal code as required", async ({ page }) => {
  await expect(
    page.locator("label", { hasText: "Code postal" }).locator(".text-red-600"),
  ).toHaveText("*");
});

test("points out a postal code that is not five digits", async ({ page }) => {
  let requests = 0;
  await page.route(ENDPOINT, (route) => {
    requests += 1;
    return route.fulfill({ status: 201, headers: CORS, body: "{}" });
  });
  await fillValidForm(page);
  await page.getByLabel("Code postal").fill("941");
  await submit(page);

  await expect(page.getByText("Code postal à 5 chiffres. Exemple : 94100.")).toBeVisible();
  await expect(page.getByLabel("Code postal")).toBeFocused();
  expect(requests).toBe(0);
});

test("sends the postal code and the anti-robot token", async ({ page }) => {
  let body: unknown = null;
  await page.route(ENDPOINT, async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 201, headers: CORS, body: "{}" });
  });
  await fillValidForm(page);
  await submit(page);

  await expect(page.getByText("C’est noté, Julien.")).toBeVisible();
  expect(body).toEqual({
    firstName: "Julien",
    company: "Ramonage Martin",
    phone: "0612345678",
    postalCode: "94100",
    slot: "afternoon",
    message: null,
    pagePath: "/sans-reseau",
    turnstileToken: "jeton-e2e",
  });
});

test("asks to wait an hour after too many requests", async ({ page }) => {
  await page.route(ENDPOINT, (route) =>
    route.fulfill({
      status: 429,
      headers: { ...CORS, "x-trace-id": "7f3a2c91deadbeef" },
      body: "{}",
    }),
  );
  await fillValidForm(page);
  await submit(page);

  await expect(page.getByRole("alert")).toHaveText(
    "Vous avez déjà envoyé plusieurs demandes. Réessayez dans une heure.",
  );
});

test("explains when the anti-robot check cannot load", async ({ page }) => {
  await page.unroute(TURNSTILE_SCRIPT);
  await page.route(TURNSTILE_SCRIPT, (route) => route.abort());
  let requests = 0;
  await page.route(ENDPOINT, (route) => {
    requests += 1;
    return route.fulfill({ status: 201, headers: CORS, body: "{}" });
  });
  await fillValidForm(page);
  await submit(page);

  await expect(page.getByRole("alert")).toHaveText(
    "La vérification anti-robot n’a pas abouti. Rechargez la page, puis réessayez.",
  );
  await expect(page.getByRole("button", { name: "Réessayer" })).toBeEnabled();
  expect(requests).toBe(0);
});

test("puts the phone number on its own line in the confirmation", async ({ page }) => {
  await page.route(ENDPOINT, (route) => route.fulfill({ status: 201, headers: CORS, body: "{}" }));
  await fillValidForm(page);
  await submit(page);

  await expect(page.getByRole("status")).toContainText("au 06 12 34 56 78.");
  expect(
    await page.locator("[data-callback-success-text]").evaluate((element) => element.innerText),
  ).toBe("On vous appelle demain après-midi, entre 14 h et 18 h,\nau 06 12 34 56 78.");
});
