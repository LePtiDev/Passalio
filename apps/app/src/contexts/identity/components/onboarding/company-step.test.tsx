import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import {
  errorReply,
  heldReply,
  installFakeApi,
  jsonReply,
  type FakeRoutes,
} from "@/test-support/fake-api";
import {
  forgetToasts,
  noContentReply,
  organizationProfile,
  SET_ACTIVE_ORGANIZATION_ROUTE,
  SHORT_TRACE_ID,
  signedInRoutes,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { onboardingFr, TEAM_SIZE_LABELS } from "../../onboarding-fr";
import type { OrganizationProfile } from "../../identity-api";
import { CompanyStep } from "./company-step";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const text = onboardingFr.company;

const CREATE_ROUTE = "POST /api/organizations";
const UPDATE_ROUTE = "PATCH /api/organization";
const SEARCH_ROUTE = "GET /api/company-search";

const createdReply = jsonReply({
  organization: { id: "organization-new", name: "Ramonage Dupont" },
});

const DUPONT = {
  name: "RAMONAGE DUPONT ET FILS",
  siret: "12345678900012",
  address: "12 RUE DES LILAS",
  postalCode: "69003",
  city: "LYON",
};

const installCompany = (routes: FakeRoutes = {}) =>
  installFakeApi({
    ...signedInRoutes("owner"),
    [CREATE_ROUTE]: createdReply,
    [SET_ACTIVE_ORGANIZATION_ROUTE]: jsonReply({ id: "organization-new" }),
    [UPDATE_ROUTE]: noContentReply(),
    ...routes,
  });

const renderCompany = (organization: OrganizationProfile | null = null) =>
  renderScreen(<CompanyStep organization={organization} />, { path: "/configuration/entreprise" });

type User = ReturnType<typeof renderCompany>["user"];

const fillCompany = async (user: User) => {
  await user.type(await screen.findByLabelText(text.nameLabel), "Ramonage Dupont");
  await user.type(screen.getByLabelText(text.siretLabel), "123 456 789 00012");
  await user.type(screen.getByLabelText(text.addressLabel), "12 rue des Lilas, 69003 Lyon");
  await user.type(screen.getByLabelText(text.phoneLabel), "04 78 00 00 00");
  await user.click(screen.getByRole("combobox", { name: text.teamSizeLabel }));
  await user.click(await screen.findByRole("option", { name: TEAM_SIZE_LABELS["2_to_5"] }));
};

describe("CompanyStep", () => {
  afterEach(forgetToasts);

  it("shows the French validation messages for the name and the SIRET", async () => {
    const api = installCompany();
    const { user } = renderCompany();

    await user.type(await screen.findByLabelText(text.siretLabel), "123");
    await user.click(screen.getByRole("button", { name: onboardingFr.layout.continue }));

    expect(await screen.findByText(text.nameInvalid)).toBeVisible();
    expect(screen.getByText(text.siretInvalid)).toBeVisible();
    expect(screen.getByLabelText(text.nameLabel)).toHaveAttribute("aria-invalid", "true");
    expect(api.requestsTo(CREATE_ROUTE)).toHaveLength(0);
  });

  it("creates the company, makes it active and opens the trades step", async () => {
    const create = heldReply(createdReply);
    const api = installCompany({ [CREATE_ROUTE]: create.reply });
    const { user, router } = renderCompany();

    await fillCompany(user);
    await user.click(screen.getByRole("button", { name: onboardingFr.layout.continue }));

    expect(await screen.findByRole("button", { name: onboardingFr.layout.saving })).toBeDisabled();
    create.release();

    await waitFor(() => expect(router.state.location.pathname).toBe("/configuration/metiers"));
    expect(api.requestsTo(CREATE_ROUTE)[0]?.body).toEqual({
      name: "Ramonage Dupont",
      siret: "12345678900012",
      address: "12 rue des Lilas, 69003 Lyon",
      phone: "04 78 00 00 00",
      teamSize: "2_to_5",
    });
    expect(api.requestsTo(SET_ACTIVE_ORGANIZATION_ROUTE)[0]?.body).toEqual({
      organizationId: "organization-new",
    });
  });

  it("sends empty optional fields as missing", async () => {
    const api = installCompany();
    const { user, router } = renderCompany();

    await user.type(await screen.findByLabelText(text.nameLabel), "Ramonage Dupont");
    await user.click(screen.getByRole("button", { name: onboardingFr.layout.continue }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/configuration/metiers"));
    expect(api.requestsTo(CREATE_ROUTE)[0]?.body).toEqual({
      name: "Ramonage Dupont",
      siret: null,
      address: null,
      phone: null,
      teamSize: null,
    });
  });

  it("updates an existing company instead of creating a new one", async () => {
    const api = installCompany();
    const { user, router } = renderCompany(organizationProfile({ name: "Ramonage Dupont" }));

    const name = await screen.findByLabelText(text.nameLabel);
    await user.clear(name);
    await user.type(name, "Dupont Ramonage");
    await user.click(screen.getByRole("button", { name: onboardingFr.layout.continue }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/configuration/metiers"));
    expect(api.requestsTo(UPDATE_ROUTE)[0]?.body).toMatchObject({ name: "Dupont Ramonage" });
    expect(api.requestsTo(CREATE_ROUTE)).toHaveLength(0);
  });

  it("shows a refused company with the short trace id and stays on the step", async () => {
    installCompany({ [CREATE_ROUTE]: errorReply("invalid_organization_name", TRACE_ID, 400) });
    const { user, router } = renderCompany();

    await user.type(await screen.findByLabelText(text.nameLabel), "Ramonage Dupont");
    await user.click(screen.getByRole("button", { name: onboardingFr.layout.continue }));

    expect(await screen.findByText(fr.errors.messages.invalid_organization_name)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(router.state.location.pathname).toBe("/configuration/entreprise");
    expect(screen.getByRole("button", { name: onboardingFr.layout.continue })).toBeEnabled();
  });

  it("fills the form from the company directory", async () => {
    const search = heldReply(jsonReply({ companies: [DUPONT] }));
    const api = installCompany({ [SEARCH_ROUTE]: search.reply });
    const { user } = renderCompany();

    await user.type(await screen.findByLabelText(text.searchLabel), "dupont");

    expect(await screen.findByLabelText(text.searching)).toBeVisible();
    search.release();

    const result = await screen.findByRole("button", { name: /RAMONAGE DUPONT ET FILS/ });
    expect(result).toHaveTextContent(text.siretLine("123 456 789 00012", "69003 Lyon"));
    await user.click(result);

    expect(screen.getByLabelText(text.nameLabel)).toHaveValue("Ramonage Dupont et Fils");
    expect(screen.getByLabelText(text.siretLabel)).toHaveValue("123 456 789 00012");
    expect(screen.getByLabelText(text.addressLabel)).toHaveValue("12 Rue des Lilas");
    expect(screen.getByLabelText(text.searchLabel)).toHaveValue("");
    expect(api.requestsTo(SEARCH_ROUTE)[0]?.search.get("q")).toBe("dupont");
  });

  it("says when the directory finds nothing", async () => {
    installCompany({ [SEARCH_ROUTE]: jsonReply({ companies: [] }) });
    const { user } = renderCompany();

    await user.type(await screen.findByLabelText(text.searchLabel), "zzzz");

    expect(await screen.findByText(text.noResult)).toBeVisible();
  });

  it("offers manual entry when the directory is unavailable", async () => {
    installCompany({ [SEARCH_ROUTE]: errorReply("internal", TRACE_ID) });
    const { user } = renderCompany();

    await user.type(await screen.findByLabelText(text.searchLabel), "dupont");

    expect(await screen.findByText(text.searchUnavailable)).toBeVisible();
    await user.click(screen.getByRole("button", { name: text.manualEntry }));
    expect(screen.getByLabelText(text.nameLabel)).toHaveFocus();
  });

  it("shows the short trace id when the directory search fails", async () => {
    installCompany({ [SEARCH_ROUTE]: errorReply("internal", TRACE_ID) });
    const { user } = renderCompany();

    await user.type(await screen.findByLabelText(text.searchLabel), "dupont");

    expect(await screen.findByText(text.searchUnavailable)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
  });

  it("does not search the directory before three characters", async () => {
    const api = installCompany({ [SEARCH_ROUTE]: jsonReply({ companies: [DUPONT] }) });
    const { user } = renderCompany();

    await user.type(await screen.findByLabelText(text.searchLabel), "du");
    expect(screen.queryByLabelText(text.searching)).toBeNull();

    await user.type(screen.getByLabelText(text.searchLabel), "p");

    expect(await screen.findByRole("button", { name: /RAMONAGE DUPONT ET FILS/ })).toBeVisible();
    expect(api.requestsTo(SEARCH_ROUTE).map(({ search }) => search.get("q"))).toEqual(["dup"]);
  });
});
