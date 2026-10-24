import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ACTOR_QUERY_KEY } from "@/contexts/identity/hooks/use-actor";
import {
  serverCustomerRecord,
  serverEquipmentRecord,
  serverSiteRecord,
} from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { ACTOR_ROUTE, actorReply } from "@/test-support/field-identity-replies";
import { newOrganizationId, outboxTypes, seedLocalDatabase } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { dismissAllToasts } from "@/test-support/toasts";
import { customersFr } from "../../fr";
import { CustomerFileScreen } from "./customer-file-screen";

const text = customersFr.file;

const CUSTOMER_ID = "customer-1";
const SITE_ID = "site-1";
const EQUIPMENT_ID = "equipment-1";

const seedMoreauWithBoiler = (organizationId: string) =>
  seedLocalDatabase(organizationId, {
    customers: [serverCustomerRecord(CUSTOMER_ID, "Moreau")],
    sites: [serverSiteRecord(SITE_ID, CUSTOMER_ID)],
    equipments: [serverEquipmentRecord(EQUIPMENT_ID, SITE_ID)],
    lastSyncedAt: "2026-10-22T10:00:00.000Z",
  });

const renderFile = (organizationId: string) => {
  installFakeApi({
    [SYNC_PULL_ROUTE]: pulledChangesReply(),
    [ACTOR_ROUTE]: actorReply("owner", organizationId),
  });
  return renderScreen(<CustomerFileScreen customerId={CUSTOMER_ID} />, {
    path: `/clients/${CUSTOMER_ID}`,
    organizationId,
  });
};

describe("CustomerFileScreen when the device cannot save", () => {
  afterEach(() => {
    dismissAllToasts();
    vi.restoreAllMocks();
  });

  it("tells the user the archive failed and keeps the customer, its site and its equipment", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreauWithBoiler(organizationId);
    vi.spyOn(database.outbox, "add").mockRejectedValue(new Error("QuotaExceededError"));
    const rendered = renderFile(organizationId);
    await waitFor(() => {
      expect(rendered.queryClient.getQueryData(ACTOR_QUERY_KEY)).toBeDefined();
    });
    const [trigger] = await screen.findAllByRole("button", { name: text.more });
    if (trigger === undefined) {
      throw new Error("customer actions menu is missing");
    }

    await rendered.user.click(trigger);
    await rendered.user.click(await screen.findByRole("menuitem", { name: text.archive }));
    const dialog = await screen.findByRole("alertdialog");
    await rendered.user.click(within(dialog).getByRole("button", { name: text.archiveConfirm }));

    expect(await screen.findByText(text.archiveFailed)).toBeVisible();
    expect(screen.queryByText(text.archived)).not.toBeInTheDocument();
    expect(rendered.router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}`);
    expect(await database.customers.get(CUSTOMER_ID)).toBeDefined();
    expect(await database.sites.get(SITE_ID)).toBeDefined();
    expect(await database.equipments.get(EQUIPMENT_ID)).toBeDefined();
    expect(await outboxTypes(organizationId)).toEqual([]);
    expect((await screen.findAllByRole("heading", { name: "Moreau" })).length).toBeGreaterThan(0);
  });

  it("tells the user the removal failed and keeps the equipment active", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreauWithBoiler(organizationId);
    vi.spyOn(database.outbox, "add").mockRejectedValue(new Error("QuotaExceededError"));
    const rendered = renderFile(organizationId);

    await rendered.user.click(await screen.findByRole("button", { name: text.equipmentActions }));
    await rendered.user.click(await screen.findByRole("menuitem", { name: text.remove }));
    const dialog = await screen.findByRole("alertdialog");
    await rendered.user.click(within(dialog).getByRole("button", { name: text.removeConfirm }));

    expect(await screen.findByText(text.removeFailed)).toBeVisible();
    expect(screen.queryByText(text.removed)).not.toBeInTheDocument();
    expect((await database.equipments.get(EQUIPMENT_ID))?.status).toBe("active");
    expect(await outboxTypes(organizationId)).toEqual([]);
    expect(screen.getByRole("button", { name: text.equipmentActions })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: text.removedEquipments(1) }),
    ).not.toBeInTheDocument();
  });
});
