import type { TradeId } from "@passalio/trades";
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ORGANIZATION_QUERY_KEY } from "@/contexts/identity/hooks/use-organization";
import {
  serverCustomerRecord,
  serverEquipmentRecord,
  serverSiteRecord,
} from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { ORGANIZATION_ROUTE, organizationReply } from "@/test-support/identity-replies";
import { holdLocalDatabaseOpening } from "@/test-support/local-holds";
import { newOrganizationId, outboxTypes, seedLocalDatabase } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { heldPushReply, SYNC_PUSH_ROUTE } from "@/test-support/sync-push-replies";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { dismissAllToasts } from "@/test-support/toasts";
import { customersFr, EQUIPMENT_KIND_LABELS, PHOTO_KIND_LABELS } from "../../fr";
import { NewEquipmentScreen } from "./new-equipment-screen";

const text = customersFr.equipmentForm;

const CUSTOMER_ID = "customer-1";
const SITE_ID = "site-1";
const BOILER_ID = "equipment-1";

const ALL_TRADES: readonly TradeId[] = [
  "chimney_sweeping",
  "stove_maintenance",
  "boiler_maintenance",
  "heat_pump_maintenance",
];

const seedSite = (organizationId: string) =>
  seedLocalDatabase(organizationId, {
    customers: [serverCustomerRecord(CUSTOMER_ID, "Moreau")],
    sites: [serverSiteRecord(SITE_ID, CUSTOMER_ID)],
    equipments: [serverEquipmentRecord(BOILER_ID, SITE_ID)],
  });

type RenderOptions = {
  readonly siteId?: string;
  readonly replaces?: string;
  readonly trades?: readonly TradeId[];
};

const renderNewEquipment = (organizationId: string, options: RenderOptions = {}) => {
  const api = installFakeApi({
    [SYNC_PULL_ROUTE]: pulledChangesReply(),
    [SYNC_PUSH_ROUTE]: heldPushReply().reply,
    [ORGANIZATION_ROUTE]: organizationReply(organizationId, options.trades ?? ALL_TRADES),
  });
  const rendered = renderScreen(
    <NewEquipmentScreen
      customerId={CUSTOMER_ID}
      siteId={options.siteId ?? SITE_ID}
      replacesEquipmentId={options.replaces}
    />,
    { path: `/clients/${CUSTOMER_ID}/appareils/nouveau`, organizationId },
  );
  return { ...rendered, api };
};

type Rendered = ReturnType<typeof renderNewEquipment>;

const waitForOrganization = async ({ queryClient }: Rendered) => {
  await waitFor(() => {
    expect(queryClient.getQueryData(ORGANIZATION_QUERY_KEY)).toBeDefined();
  });
};

const save = async ({ user }: Rendered) => {
  await user.click(screen.getByRole("button", { name: text.save }));
};

describe("NewEquipmentScreen", () => {
  afterEach(dismissAllToasts);

  it("shows a form skeleton until the customer is read from the device", async () => {
    const organizationId = newOrganizationId();
    const read = holdLocalDatabaseOpening(await seedSite(organizationId));

    renderNewEquipment(organizationId);

    expect(await screen.findByRole("generic", { busy: true })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: text.save })).not.toBeInTheDocument();

    read.release();

    expect(await screen.findByRole("button", { name: text.save })).toBeVisible();
  });

  it("explains that the customer or the site does not exist", async () => {
    const organizationId = newOrganizationId();
    await seedSite(organizationId);

    renderNewEquipment(organizationId, { siteId: "site-unknown" });

    expect(
      await screen.findByRole("heading", { name: customersFr.file.notFoundTitle }),
    ).toBeVisible();
  });

  it("offers only the equipment kinds covered by the company's trades", async () => {
    const organizationId = newOrganizationId();
    await seedSite(organizationId);
    const rendered = renderNewEquipment(organizationId, { trades: ["chimney_sweeping"] });
    await waitForOrganization(rendered);

    const flueKinds = await screen.findByRole("radiogroup", { name: text.kindGroups.flue });

    expect(
      within(flueKinds).getByRole("radio", { name: EQUIPMENT_KIND_LABELS.insert }),
    ).toBeInTheDocument();
    expect(
      within(flueKinds).getByRole("radio", { name: EQUIPMENT_KIND_LABELS.boiler }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("radiogroup", { name: text.kindGroups.heatPump }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: EQUIPMENT_KIND_LABELS.air_to_water_heat_pump }),
    ).not.toBeInTheDocument();
  });

  it("asks for the equipment kind and saves nothing without it", async () => {
    const organizationId = newOrganizationId();
    const database = await seedSite(organizationId);
    const rendered = renderNewEquipment(organizationId);
    await screen.findByRole("button", { name: text.save });

    await save(rendered);

    expect(await screen.findByText(customersFr.form.errors.kind)).toBeVisible();
    expect(await database.equipments.count()).toBe(1);
    expect(await outboxTypes(organizationId)).toEqual([]);
  });

  it("adds the equipment to the site on the device, queues it and returns to the file", async () => {
    const organizationId = newOrganizationId();
    const database = await seedSite(organizationId);
    const rendered = renderNewEquipment(organizationId);
    await waitForOrganization(rendered);
    await rendered.user.click(
      await screen.findByRole("radio", { name: EQUIPMENT_KIND_LABELS.log_stove }),
    );
    expect(screen.getByRole("radio", { name: "Bûches" })).toBeChecked();
    await rendered.user.type(screen.getByLabelText(/^Marque/), "Invicta");

    await save(rendered);

    expect(await screen.findByText(customersFr.toasts.equipmentCreated)).toBeVisible();
    await waitFor(() => {
      expect(rendered.router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}`);
    });
    const added = (await database.equipments.toArray()).find(({ id }) => id !== BOILER_ID);
    expect(added).toMatchObject({
      siteId: SITE_ID,
      kind: "log_stove",
      energy: "wood_logs",
      brand: "Invicta",
      status: "active",
    });
    expect((await database.equipments.get(BOILER_ID))?.status).toBe("active");
    expect(await outboxTypes(organizationId)).toEqual(["add_equipment"]);
    expect(rendered.api.requestsTo("POST /api/sites/site-1/equipments")).toEqual([]);
  });

  it("replaces the chosen equipment, which stays in the history", async () => {
    const organizationId = newOrganizationId();
    const database = await seedSite(organizationId);
    const rendered = renderNewEquipment(organizationId, { replaces: BOILER_ID });
    await waitForOrganization(rendered);
    expect(await screen.findByRole("radio", { name: text.installedByUs })).toBeChecked();

    await rendered.user.click(
      screen.getByRole("radio", { name: EQUIPMENT_KIND_LABELS.air_to_water_heat_pump }),
    );

    expect(
      screen.getAllByText(text.replaceNoteOf("air_to_water_heat_pump", "boiler")).length,
    ).toBeGreaterThan(0);

    await save(rendered);

    expect(await screen.findByText(customersFr.toasts.equipmentReplaced)).toBeVisible();
    const heatPump = (await database.equipments.toArray()).find(({ id }) => id !== BOILER_ID);
    expect(heatPump).toMatchObject({ kind: "air_to_water_heat_pump", isInstalledByUs: true });
    expect(await database.equipments.get(BOILER_ID)).toMatchObject({
      status: "removed",
      replacedByEquipmentId: heatPump?.id,
    });
    const [entry] = await database.outbox.toArray();
    expect(entry?.mutation).toMatchObject({
      type: "add_equipment",
      replacesEquipmentId: BOILER_ID,
    });
  });

  it("keeps the plate photo on the device until it can be sent", async () => {
    const organizationId = newOrganizationId();
    const database = await seedSite(organizationId);
    const rendered = renderNewEquipment(organizationId);
    await waitForOrganization(rendered);
    const plate = new File(["plate"], "plate.jpg", { type: "image/jpeg" });

    await rendered.user.upload(await screen.findByLabelText(PHOTO_KIND_LABELS.plate), plate);
    expect(await screen.findByRole("img", { name: PHOTO_KIND_LABELS.plate })).toBeVisible();
    await rendered.user.click(screen.getByRole("radio", { name: EQUIPMENT_KIND_LABELS.boiler }));
    await save(rendered);

    expect(await screen.findByText(customersFr.toasts.equipmentCreated)).toBeVisible();
    const [pending] = await database.pendingPhotos.toArray();
    expect(pending).toMatchObject({ kind: "plate" });
    expect(
      await database.photos
        .where("equipmentId")
        .equals(pending?.equipmentId ?? "")
        .count(),
    ).toBe(1);
    expect(rendered.api.requests.filter(({ path }) => path.endsWith("/photos"))).toEqual([]);
  });
});
