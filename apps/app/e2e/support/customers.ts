import type { CustomerFields, EquipmentFields, SiteFields } from "@passalio/shared";
import { expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
import * as z from "zod";

const ADDRESS_SEARCH_PATTERN = "https://data.geopf.fr/geocodage/search**";

export type AddressStub = {
  readonly address: string;
  readonly postalCode: string;
  readonly city: string;
};

export const BAN_ADDRESS: AddressStub = {
  address: "12 rue des Ramoneurs",
  postalCode: "94130",
  city: "Nogent-sur-Marne",
};

export const stubAddressSearch = async (
  context: BrowserContext,
  suggestions: readonly AddressStub[] = [BAN_ADDRESS],
) => {
  await context.route(ADDRESS_SEARCH_PATTERN, (route) =>
    route.fulfill({
      json: {
        features: suggestions.map((suggestion, index) => ({
          geometry: { coordinates: [2.48, 48.83] },
          properties: {
            id: `stub-${index}`,
            name: suggestion.address,
            postcode: suggestion.postalCode,
            city: suggestion.city,
          },
        })),
      },
    }),
  );
};

export type IndividualCustomer = {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly address: string;
  readonly postalCode: string;
  readonly city: string;
};

export const uniqueName = (prefix: string) =>
  `${prefix}${crypto
    .randomUUID()
    .replaceAll(/[^a-f]/g, "")
    .slice(0, 6)}`;

export const newIndividualCustomer = (
  overrides: Partial<IndividualCustomer> = {},
): IndividualCustomer => ({
  firstName: "Martine",
  lastName: uniqueName("Moreau"),
  phone: "06 98 76 54 32",
  address: "45 boulevard de Strasbourg",
  postalCode: "94130",
  city: "Nogent-sur-Marne",
  ...overrides,
});

export const openNewCustomerForm = async (page: Page) => {
  await page.goto("/clients/nouveau");
  await expect(page.getByRole("heading", { name: "Nouveau client" })).toBeVisible();
  await expect(page.getByLabel("Nom", { exact: true })).toBeVisible();
};

export const chooseOption = async (page: Page, group: string, option: string) => {
  const radioGroup = page.getByRole("radiogroup", { name: group });
  await radioGroup.getByText(option, { exact: true }).click();
  await expect(radioGroup.getByRole("radio", { name: option })).toBeChecked();
};

export const fillManualAddress = async (
  page: Page,
  { address, postalCode, city }: Pick<IndividualCustomer, "address" | "postalCode" | "city">,
) => {
  await page.getByLabel("Adresse", { exact: true }).fill(address);
  const manualEntry = page.getByRole("button", { name: "Saisir à la main" });
  if (await page.getByLabel("Code postal").isHidden()) {
    await manualEntry.click();
  }
  await expect(page.getByLabel("Code postal")).toBeVisible();
  await page.getByLabel("Code postal").fill(postalCode);
  await page.getByLabel("Ville").fill(city);
};

export const fillIndividualCustomer = async (page: Page, customer: IndividualCustomer) => {
  await page.getByLabel("Prénom").fill(customer.firstName);
  await page.getByLabel("Nom", { exact: true }).fill(customer.lastName);
  await page.getByLabel("Téléphone").fill(customer.phone);
  await fillManualAddress(page, customer);
};

export const customerNameOf = (customer: Pick<IndividualCustomer, "firstName" | "lastName">) =>
  `${customer.firstName} ${customer.lastName}`;

export const createIndividualCustomer = async (page: Page, customer: IndividualCustomer) => {
  await openNewCustomerForm(page);
  await fillIndividualCustomer(page, customer);
  await page.getByRole("button", { name: "Enregistrer le client" }).click();
  await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
  return customerIdOf(page);
};

const CUSTOMER_URL = /\/clients\/([0-9a-f-]{36})(?:[/?#]|$)/;

export const customerIdOf = (page: Page) => {
  const id = CUSTOMER_URL.exec(page.url())?.[1];
  if (id === undefined) {
    throw new Error(`No customer id in ${page.url()}`);
  }
  return id;
};

export const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true }).first();

export const syncIndicator = (page: Page, text: string | RegExp) => visible(page, text);

export const PENDING_OFFLINE = /^Hors ligne · \d+ à envoyer$/;

export const PENDING_BANNER =
  /^Vous pouvez continuer\. \d+ modifications? (sera envoyée|seront envoyées) dès le retour du réseau\.$/;

export const expectUpToDate = async (page: Page) => {
  await expect(syncIndicator(page, /à jour/i)).toBeVisible({ timeout: 15_000 });
};

const serverCustomer = z.object({
  id: z.string(),
  kind: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  companyName: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
});

const serverSite = z.object({
  id: z.string(),
  customerId: z.string(),
  label: z.string().nullable(),
  address: z.string(),
  postalCode: z.string(),
  city: z.string(),
});

const serverEquipment = z.object({
  id: z.string(),
  siteId: z.string(),
  kind: z.string(),
  energy: z.string().nullable(),
  brand: z.string().nullable(),
  status: z.string(),
  details: z.record(z.string(), z.unknown()).nullable(),
});

const serverPhoto = z.object({ id: z.string(), equipmentId: z.string(), kind: z.string() });

const customerFileResponse = z.object({
  customer: serverCustomer,
  sites: z.array(serverSite),
  equipments: z.array(serverEquipment),
  photos: z.array(serverPhoto),
});

export type ServerCustomerFile = z.infer<typeof customerFileResponse>;

export const serverCustomerFile = async (request: APIRequestContext, customerId: string) => {
  const response = await request.get(`/api/customers/${customerId}`);
  if (response.status() === 404) {
    return null;
  }
  expect(response.status()).toBe(200);
  return customerFileResponse.parse(await response.json());
};

export const expectOnServer = async (
  request: APIRequestContext,
  customerId: string,
  check: (file: ServerCustomerFile) => boolean,
) => {
  await expect
    .poll(
      async () => {
        const file = await serverCustomerFile(request, customerId);
        return file !== null && check(file);
      },
      { timeout: 15_000 },
    )
    .toBe(true);
};

const createdCustomer = z.object({
  customer: z.object({ id: z.string() }),
  site: z.object({ id: z.string() }).nullable().optional(),
});

export const seedCustomer = async (
  request: APIRequestContext,
  customer: CustomerFields,
  site?: SiteFields,
) => {
  const response = await request.post("/api/customers", {
    data: site === undefined ? { customer } : { customer, site },
  });
  expect(response.status()).toBe(201);
  const created = createdCustomer.parse(await response.json());
  return { customerId: created.customer.id, siteId: created.site?.id ?? null };
};

export const seedEquipment = async (
  request: APIRequestContext,
  siteId: string,
  equipment: EquipmentFields,
) => {
  const response = await request.post(`/api/sites/${siteId}/equipments`, { data: equipment });
  expect(response.status()).toBe(201);
  return z.object({ id: z.string() }).parse(await response.json()).id;
};
