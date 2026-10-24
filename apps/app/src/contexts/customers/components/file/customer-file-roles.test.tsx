import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ACTOR_QUERY_KEY } from "@/contexts/identity/hooks/use-actor";
import {
  serverCustomerRecord,
  serverEquipmentRecord,
  serverSiteRecord,
} from "@/lib/sync/sync-test-records";
import { errorReply, heldReply, installFakeApi, type FakeReply } from "@/test-support/fake-api";
import { ACTOR_ROUTE, actorReply } from "@/test-support/field-identity-replies";
import { newOrganizationId, seedLocalDatabase } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { customersFr } from "../../fr";
import { CustomerFileScreen } from "./customer-file-screen";

const text = customersFr.file;

const CUSTOMER_ID = "customer-1";

const seedMoreau = (organizationId: string) =>
  seedLocalDatabase(organizationId, {
    customers: [serverCustomerRecord(CUSTOMER_ID, "Moreau")],
    sites: [serverSiteRecord("site-1", CUSTOMER_ID)],
    equipments: [serverEquipmentRecord("equipment-1", "site-1")],
    lastSyncedAt: "2026-10-22T10:00:00.000Z",
  });

const renderFile = (organizationId: string, actor: FakeReply) => {
  installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply(), [ACTOR_ROUTE]: actor });
  return renderScreen(<CustomerFileScreen customerId={CUSTOMER_ID} />, {
    path: `/clients/${CUSTOMER_ID}`,
    organizationId,
  });
};

type Rendered = ReturnType<typeof renderFile>;

const archiveItemsIn = async ({ user }: Rendered, trigger: HTMLElement | undefined) => {
  if (trigger === undefined) {
    throw new Error("customer actions menu is missing");
  }
  await user.click(trigger);
  const menu = await screen.findByRole("menu");
  expect(within(menu).getByRole("menuitem", { name: text.addSite })).toBeVisible();
  const archiveCount = within(menu).queryAllByRole("menuitem", { name: text.archive }).length;
  await user.keyboard("{Escape}");
  await waitFor(() => {
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
  return archiveCount;
};

const archiveItemsInEveryMenu = async (rendered: Rendered) => {
  const triggers = await screen.findAllByRole("button", { name: text.more });
  const [mobileBar, desktopHeader] = triggers;
  const inMobileBar = await archiveItemsIn(rendered, mobileBar);
  const inDesktopHeader = await archiveItemsIn(rendered, desktopHeader);
  return { triggerCount: triggers.length, archiveCount: inMobileBar + inDesktopHeader };
};

describe("CustomerFileScreen archive permission", () => {
  it("hides the archive action while the user's role is not known yet", async () => {
    const organizationId = newOrganizationId();
    await seedMoreau(organizationId);
    const actor = heldReply(actorReply("owner", organizationId));
    const rendered = renderFile(organizationId, actor.reply);

    expect((await screen.findAllByRole("heading", { name: "Moreau" })).length).toBeGreaterThan(0);
    const whileUnknown = await archiveItemsInEveryMenu(rendered);
    expect(whileUnknown.archiveCount).toBe(0);

    actor.release();
    await waitFor(() => {
      expect(rendered.queryClient.getQueryData(ACTOR_QUERY_KEY)).toBeDefined();
    });

    const onceKnown = await archiveItemsInEveryMenu(rendered);
    expect(onceKnown.archiveCount).toBe(onceKnown.triggerCount);
  });

  it("does not offer a technician to archive from the mobile bar nor the desktop header", async () => {
    const organizationId = newOrganizationId();
    await seedMoreau(organizationId);
    const rendered = renderFile(organizationId, actorReply("technician", organizationId));
    await waitFor(() => {
      expect(rendered.queryClient.getQueryData(ACTOR_QUERY_KEY)).toBeDefined();
    });

    const { triggerCount, archiveCount } = await archiveItemsInEveryMenu(rendered);

    expect(triggerCount).toBe(2);
    expect(archiveCount).toBe(0);
  });

  it("does not offer to archive while support is viewing the account of an owner", async () => {
    const organizationId = newOrganizationId();
    await seedMoreau(organizationId);
    const rendered = renderFile(organizationId, actorReply("owner", organizationId, true));
    await waitFor(() => {
      expect(rendered.queryClient.getQueryData(ACTOR_QUERY_KEY)).toBeDefined();
    });

    const { archiveCount } = await archiveItemsInEveryMenu(rendered);

    expect(archiveCount).toBe(0);
  });

  it("does not offer to archive when the user's role cannot be loaded", async () => {
    const organizationId = newOrganizationId();
    await seedMoreau(organizationId);
    const rendered = renderFile(
      organizationId,
      errorReply("internal", "5e6f7a8b-0000-4000-8000-000000000000"),
    );
    await waitFor(() => {
      expect(rendered.queryClient.getQueryState(ACTOR_QUERY_KEY)?.status).toBe("error");
    });

    const { archiveCount } = await archiveItemsInEveryMenu(rendered);

    expect(archiveCount).toBe(0);
  });
});
