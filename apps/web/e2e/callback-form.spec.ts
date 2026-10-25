import { expect, test } from "@playwright/test";

const ENDPOINT = "**/api/public/callback-requests";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-expose-headers": "x-trace-id",
};

test.beforeEach(async ({ page }) => {
  await page.goto("/sans-reseau");
});

test("points out a missing first name and an incomplete number", async ({ page }) => {
  let requests = 0;
  await page.route(ENDPOINT, (route) => {
    requests += 1;
    return route.fulfill({ status: 201, headers: CORS });
  });
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 12 34");
  await page.getByRole("button", { name: "Être rappelé", exact: true }).click();

  await expect(page.getByText("Indiquez votre prénom.")).toBeVisible();
  await expect(page.getByText("Numéro incomplet. Exemple : 06 12 34 56 78.")).toBeVisible();
  await expect(page.getByLabel("Prénom")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Prénom")).toBeFocused();
  expect(requests).toBe(0);
});

test("sends the request and confirms when we will call", async ({ page }) => {
  let body: unknown = null;
  await page.route(ENDPOINT, async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 201, headers: CORS, body: "{}" });
  });
  await page.getByLabel("Prénom").fill("Julien");
  await page.getByLabel("Entreprise").fill("Ramonage Martin");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06.12.34.56.78");
  await page.getByLabel("Moment").selectOption("afternoon");
  await page.getByRole("button", { name: "Être rappelé", exact: true }).click();

  await expect(page.getByText("C’est noté, Julien.")).toBeVisible();
  await expect(
    page.getByText("On vous appelle demain après-midi, entre 14 h et 18 h, au 06 12 34 56 78."),
  ).toBeVisible();
  expect(body).toEqual({
    firstName: "Julien",
    company: "Ramonage Martin",
    phone: "0612345678",
    slot: "afternoon",
    message: null,
    pagePath: "/sans-reseau",
  });
});

test("shows the short trace code when the server refuses", async ({ page }) => {
  await page.route(ENDPOINT, (route) =>
    route.fulfill({
      status: 500,
      headers: { ...CORS, "x-trace-id": "7f3a2c91deadbeef" },
      body: "{}",
    }),
  );
  await page.getByLabel("Prénom").fill("Julien");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("0612345678");
  await page.getByRole("button", { name: "Être rappelé", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Votre demande n’est pas partie. Réessayez dans un instant. Code : 7f3a2c91",
  );
  await expect(page.getByRole("button", { name: "Réessayer" })).toBeEnabled();
});

test("asks to check the connection when the request cannot leave", async ({ page }) => {
  await page.route(ENDPOINT, (route) => route.abort());
  await page.getByLabel("Prénom").fill("Julien");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("0612345678");
  await page.getByRole("button", { name: "Être rappelé", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Votre demande n’est pas partie. Vérifiez votre connexion, puis réessayez.",
  );
});
