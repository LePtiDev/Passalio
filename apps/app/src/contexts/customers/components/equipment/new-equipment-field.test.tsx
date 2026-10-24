import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  serverCustomerRecord,
  serverEquipmentRecord,
  serverSiteRecord,
} from "@/lib/sync/sync-test-records";
import { newOrganizationId, outboxTypes, seedLocalDatabase } from "@/test-support/local-seeds";
import { goOffline } from "@/test-support/network";
import { renderScreen } from "@/test-support/render-screen";
import { dismissAllToasts } from "@/test-support/toasts";
import { makeNetworkUnreachable } from "@/test-support/unreachable-network";
import { customersFr, EQUIPMENT_KIND_LABELS, PHOTO_KIND_LABELS } from "../../fr";
import { NewEquipmentScreen } from "./new-equipment-screen";

const text = customersFr.equipmentForm;

const CUSTOMER_ID = "customer-1";
const SITE_ID = "site-1";
const BOILER_ID = "equipment-1";

const seedSite = (organizationId: string) =>
  seedLocalDatabase(organizationId, {
    customers: [serverCustomerRecord(CUSTOMER_ID, "Moreau")],
    sites: [serverSiteRecord(SITE_ID, CUSTOMER_ID)],
    equipments: [serverEquipmentRecord(BOILER_ID, SITE_ID)],
    lastSyncedAt: "2026-10-22T10:00:00.000Z",
  });

const renderNewEquipment = (organizationId: string, replacesEquipmentId?: string) =>
  renderScreen(
    <NewEquipmentScreen
      customerId={CUSTOMER_ID}
      siteId={SITE_ID}
      replacesEquipmentId={replacesEquipmentId}
    />,
    { path: `/clients/${CUSTOMER_ID}/appareils/nouveau`, organizationId },
  );

describe("NewEquipmentScreen on the field", () => {
  afterEach(() => {
    dismissAllToasts();
    vi.restoreAllMocks();
  });

  it("still offers the equipment kinds and saves on the device when the server cannot be reached", async () => {
    const organizationId = newOrganizationId();
    const database = await seedSite(organizationId);
    const fetch = makeNetworkUnreachable();
    const { user, router } = renderNewEquipment(organizationId);

    await user.click(await screen.findByRole("radio", { name: EQUIPMENT_KIND_LABELS.log_stove }));
    await user.click(screen.getByRole("button", { name: text.save }));

    expect(await screen.findByText(customersFr.toasts.equipmentCreated)).toBeVisible();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}`);
    });
    const kinds = (await database.equipments.toArray()).map(({ kind }) => kind);
    expect(kinds.toSorted()).toEqual(["boiler", "log_stove"]);
    expect(await outboxTypes(organizationId)).toEqual(["add_equipment"]);
    const posted = fetch.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(posted).toEqual([]);
  });

  it("counts the plate photo among the changes left to send while offline", async () => {
    const organizationId = newOrganizationId();
    await seedSite(organizationId);
    goOffline();
    makeNetworkUnreachable();
    const { user } = renderNewEquipment(organizationId);
    const plate = new File(["plate"], "plate.jpg", { type: "image/jpeg" });

    await user.upload(await screen.findByLabelText(PHOTO_KIND_LABELS.plate), plate);
    await user.click(screen.getByRole("radio", { name: EQUIPMENT_KIND_LABELS.boiler }));
    await user.click(screen.getByRole("button", { name: text.save }));

    expect(await screen.findByText(customersFr.toasts.equipmentCreated)).toBeVisible();
    expect((await screen.findAllByText(customersFr.sync.offline(2))).length).toBeGreaterThan(0);
  });

  it("tells the user the equipment was not saved and keeps the replaced one active", async () => {
    const organizationId = newOrganizationId();
    const database = await seedSite(organizationId);
    vi.spyOn(database.outbox, "add").mockRejectedValue(new Error("QuotaExceededError"));
    goOffline();
    makeNetworkUnreachable();
    const { user, router } = renderNewEquipment(organizationId, BOILER_ID);

    await user.click(
      await screen.findByRole("radio", { name: EQUIPMENT_KIND_LABELS.air_to_water_heat_pump }),
    );
    await user.click(screen.getByRole("button", { name: text.save }));

    expect(await screen.findByText(customersFr.form.errors.saveFailed)).toBeVisible();
    expect(screen.queryByText(customersFr.toasts.equipmentReplaced)).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}/appareils/nouveau`);
    expect(await database.equipments.count()).toBe(1);
    expect((await database.equipments.get(BOILER_ID))?.status).toBe("active");
    expect(await outboxTypes(organizationId)).toEqual([]);
  });
});
