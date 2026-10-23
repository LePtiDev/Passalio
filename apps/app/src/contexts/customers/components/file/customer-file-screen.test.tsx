import type { OrganizationRole } from "@passalio/shared";
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ACTOR_QUERY_KEY } from "@/contexts/identity/hooks/use-actor";
import type { CustomerRecord } from "@/lib/db/local-records";
import {
  serverCustomerRecord,
  serverEquipmentRecord,
  serverSiteRecord,
} from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { ACTOR_ROUTE, actorReply } from "@/test-support/identity-replies";
import { newOrganizationId, outboxTypes, seedLocalDatabase } from "@/test-support/local-seeds";
import { holdLocalDatabaseOpening } from "@/test-support/local-holds";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { dismissAllToasts } from "@/test-support/toasts";
import { customersFr } from "../../fr";
import { CustomerFileScreen } from "./customer-file-screen";

const text = customersFr.file;

const CUSTOMER_ID = "customer-1";
const SITE_ID = "site-1";
const EQUIPMENT_ID = "equipment-1";

const moreau: CustomerRecord = {
  ...serverCustomerRecord(CUSTOMER_ID, "Moreau"),
  firstName: "Martine",
  civility: "mrs",
  phone: "06 12 34 56 78",
};

const ARCHIVING_ROLES: readonly OrganizationRole[] = ["owner", "admin", "secretary"];

const seedMoreauWithBoiler = (organizationId: string) =>
  seedLocalDatabase(organizationId, {
    customers: [moreau],
    sites: [serverSiteRecord(SITE_ID, CUSTOMER_ID)],
    equipments: [serverEquipmentRecord(EQUIPMENT_ID, SITE_ID)],
    lastSyncedAt: "2026-10-22T10:00:00.000Z",
  });

const renderFile = (organizationId: string, role: OrganizationRole) => {
  const api = installFakeApi({
    [SYNC_PULL_ROUTE]: pulledChangesReply(),
    [ACTOR_ROUTE]: actorReply(role, organizationId),
  });
  const rendered = renderScreen(<CustomerFileScreen customerId={CUSTOMER_ID} />, {
    path: `/clients/${CUSTOMER_ID}`,
    organizationId,
  });
  return { ...rendered, api };
};

const waitForActor = async (rendered: ReturnType<typeof renderFile>) => {
  await waitFor(() => {
    expect(rendered.queryClient.getQueryData(ACTOR_QUERY_KEY)).toBeDefined();
  });
};

const openCustomerMenu = async (rendered: ReturnType<typeof renderFile>) => {
  const [trigger] = await screen.findAllByRole("button", { name: text.more });
  if (trigger === undefined) {
    throw new Error("customer actions menu is missing");
  }
  await rendered.user.click(trigger);
  return screen.findByRole("menu");
};

describe("CustomerFileScreen", () => {
  afterEach(dismissAllToasts);
  it("shows a skeleton until the local customer file is read", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreauWithBoiler(organizationId);
    const read = holdLocalDatabaseOpening(database);

    renderFile(organizationId, "owner");

    expect(await screen.findByRole("generic", { busy: true })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Martine Moreau" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: text.notFoundTitle })).not.toBeInTheDocument();

    read.release();

    expect((await screen.findAllByRole("heading", { name: "Martine Moreau" })).length).toBe(2);
    expect(screen.queryByRole("generic", { busy: true })).not.toBeInTheDocument();
  });

  it("explains that the customer does not exist and links back to the list", async () => {
    const organizationId = newOrganizationId();

    const { user, router } = renderFile(organizationId, "owner");

    expect(await screen.findByRole("heading", { name: text.notFoundTitle })).toBeVisible();
    expect(screen.getByText(text.notFoundText)).toBeVisible();
    await user.click(screen.getByRole("link", { name: text.backToList }));

    expect(router.state.location.pathname).toBe("/clients");
  });

  it("shows the customer, its site and its equipment from the local database only", async () => {
    const organizationId = newOrganizationId();
    await seedMoreauWithBoiler(organizationId);

    const { api } = renderFile(organizationId, "owner");

    expect((await screen.findAllByRole("heading", { name: "Martine Moreau" })).length).toBe(2);
    expect(screen.getAllByText(/Cliente depuis le/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: text.sites })).toBeVisible();
    expect(screen.getByText("1 rue A, 94200 Ivry-sur-Seine")).toBeVisible();
    expect(screen.getByText("Chaudière")).toBeVisible();
    expect(screen.getAllByRole("link", { name: text.call })[0]).toHaveAttribute(
      "href",
      "tel:06 12 34 56 78",
    );
    expect(screen.getAllByRole("heading", { name: text.history }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(text.historyEmptyTitle).length).toBeGreaterThan(0);
    const customerRequests = api.requests.filter(({ path }) => path.startsWith("/api/customers"));
    expect(customerRequests).toEqual([]);
  });

  it("offers to add the first equipment of a site that has none", async () => {
    const organizationId = newOrganizationId();
    await seedLocalDatabase(organizationId, {
      customers: [moreau],
      sites: [serverSiteRecord(SITE_ID, CUSTOMER_ID)],
    });

    const { user, router } = renderFile(organizationId, "owner");

    expect(await screen.findByText(text.noEquipmentTitle)).toBeVisible();
    expect(screen.getByText(text.noEquipmentText)).toBeVisible();
    const addLink = screen.getByRole("link", { name: text.addEquipment });
    expect(addLink).toHaveAttribute(
      "href",
      `/clients/${CUSTOMER_ID}/appareils/nouveau?lieu=${SITE_ID}`,
    );
    await user.click(addLink);

    expect(router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}/appareils/nouveau`);
  });

  it.each(ARCHIVING_ROLES)(
    "lets the %s archive the customer, removing it locally and queuing the archive",
    async (role) => {
      const organizationId = newOrganizationId();
      const database = await seedMoreauWithBoiler(organizationId);
      const rendered = renderFile(organizationId, role);
      await waitForActor(rendered);

      const menu = await openCustomerMenu(rendered);
      await rendered.user.click(within(menu).getByRole("menuitem", { name: text.archive }));
      const dialog = await screen.findByRole("alertdialog", {
        name: text.archiveTitle("Martine Moreau"),
      });
      expect(within(dialog).getByText(text.archiveText)).toBeVisible();
      await rendered.user.click(within(dialog).getByRole("button", { name: text.archiveConfirm }));

      expect(await screen.findByText(text.archived)).toBeVisible();
      await waitFor(() => {
        expect(rendered.router.state.location.pathname).toBe("/clients");
      });
      expect(await database.customers.get(CUSTOMER_ID)).toBeUndefined();
      expect(await database.sites.get(SITE_ID)).toBeUndefined();
      expect(await database.equipments.get(EQUIPMENT_ID)).toBeUndefined();
      expect(await outboxTypes(organizationId)).toEqual(["archive_customer"]);
      expect(rendered.api.requestsTo("DELETE /api/customers/customer-1")).toEqual([]);
    },
  );

  it("does not offer a technician to archive the customer", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreauWithBoiler(organizationId);
    const rendered = renderFile(organizationId, "technician");
    await waitForActor(rendered);

    const menu = await openCustomerMenu(rendered);

    expect(within(menu).getByRole("menuitem", { name: text.addSite })).toBeVisible();
    expect(within(menu).queryByRole("menuitem", { name: text.archive })).not.toBeInTheDocument();
    expect(screen.queryByText(text.archive)).not.toBeInTheDocument();
    expect(await database.customers.get(CUSTOMER_ID)).toBeDefined();
  });

  it("keeps the customer when the archive is cancelled", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreauWithBoiler(organizationId);
    const rendered = renderFile(organizationId, "owner");
    await waitForActor(rendered);

    const menu = await openCustomerMenu(rendered);
    await rendered.user.click(within(menu).getByRole("menuitem", { name: text.archive }));
    const dialog = await screen.findByRole("alertdialog");
    await rendered.user.click(within(dialog).getByRole("button", { name: text.confirmCancel }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(await database.customers.get(CUSTOMER_ID)).toBeDefined();
    expect(await outboxTypes(organizationId)).toEqual([]);
    expect(rendered.router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}`);
  });

  it("removes an equipment locally and keeps it in the history", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreauWithBoiler(organizationId);
    const rendered = renderFile(organizationId, "technician");

    await rendered.user.click(await screen.findByRole("button", { name: text.equipmentActions }));
    await rendered.user.click(await screen.findByRole("menuitem", { name: text.remove }));
    const dialog = await screen.findByRole("alertdialog", {
      name: text.removeTitle("Chaudière"),
    });
    await rendered.user.click(within(dialog).getByRole("button", { name: text.removeConfirm }));

    expect(await screen.findByText(text.removed)).toBeVisible();
    expect(await screen.findByRole("button", { name: text.removedEquipments(1) })).toBeVisible();
    expect(screen.queryByRole("button", { name: text.equipmentActions })).not.toBeInTheDocument();
    expect((await database.equipments.get(EQUIPMENT_ID))?.status).toBe("removed");
    expect(await outboxTypes(organizationId)).toEqual(["remove_equipment"]);
  });

  it("opens the replacement form for the chosen equipment", async () => {
    const organizationId = newOrganizationId();
    await seedMoreauWithBoiler(organizationId);
    const rendered = renderFile(organizationId, "technician");

    await rendered.user.click(await screen.findByRole("button", { name: text.equipmentActions }));
    await rendered.user.click(await screen.findByRole("menuitem", { name: text.replace }));

    await waitFor(() => {
      expect(rendered.router.state.location.pathname).toBe(
        `/clients/${CUSTOMER_ID}/appareils/nouveau`,
      );
    });
    expect(rendered.router.state.location.search).toEqual({
      lieu: SITE_ID,
      remplace: EQUIPMENT_ID,
    });
  });
});
