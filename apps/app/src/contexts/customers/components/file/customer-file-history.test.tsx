import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EquipmentRecord } from "@/lib/db/local-records";
import {
  serverCustomerRecord,
  serverEquipmentRecord,
  serverSiteRecord,
} from "@/lib/sync/sync-test-records";
import { signedCertificateDocument } from "@/test-support/certificate-visit";
import { installFakeApi } from "@/test-support/fake-api";
import { ACTOR_ROUTE, actorReply } from "@/test-support/field-identity-replies";
import { newOrganizationId } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { CustomerFileScreen } from "./customer-file-screen";

const insert: EquipmentRecord = {
  ...serverEquipmentRecord("equipment-insert", "site-1"),
  kind: "insert",
  energy: "wood_logs",
};

const renderFile = async (documents: Parameters<typeof signedCertificateDocument>[0][]) => {
  const organizationId = newOrganizationId();
  installFakeApi({
    [SYNC_PULL_ROUTE]: pulledChangesReply(),
    [ACTOR_ROUTE]: actorReply("owner", organizationId),
  });
  const rendered = renderScreen(<CustomerFileScreen customerId="customer-1" />, {
    path: "/clients/customer-1",
    organizationId,
  });
  await rendered.database.customers.put(serverCustomerRecord("customer-1", "Lefort"));
  await rendered.database.sites.put(serverSiteRecord("site-1", "customer-1"));
  await rendered.database.equipments.put(insert);
  await rendered.database.documents.bulkPut(
    documents.map((overrides) => signedCertificateDocument(overrides)),
  );
  return rendered;
};

const historyOf = async () => {
  const headings = await screen.findAllByRole("heading", { name: "Historique" });
  const section = headings[0]?.closest("section");
  if (section === null || section === undefined) {
    throw new Error("history_not_found");
  }
  return within(section);
};

describe("certificate history on the customer file", () => {
  it("lists the signed certificates of the customer, each opening its certificate page", async () => {
    await renderFile([{ id: "document-1", number: 142 }]);
    const history = await historyOf();

    const row = await history.findByRole("link", { name: /Insert bois · RD-2026-0142/ });
    expect(row).toHaveAttribute("href", "/certificats/document-1");
    expect(within(row).getByText("23 oct. 2026 · Ramonage · Jean Dupont")).toBeInTheDocument();
    expect(within(row).getByText("Signé")).toBeInTheDocument();
    expect(history.getByText("1 certificat")).toBeInTheDocument();
  });

  it("shows a cancelled certificate struck through with the number of its correction", async () => {
    await renderFile([
      { id: "document-1", number: 61 },
      {
        id: "document-2",
        number: 62,
        cancelsDocumentId: "document-1",
        signedAt: "2026-10-23T09:00:00.000Z",
      },
    ]);
    const history = await historyOf();

    const cancelled = await history.findByRole("link", { name: /RD-2026-0061/ });
    expect(within(cancelled).getByText("Annulé")).toBeInTheDocument();
    expect(
      within(cancelled).getByText("23 oct. 2026 · Corrigé par RD-2026-0062"),
    ).toBeInTheDocument();
    expect(history.getByText("2 certificats")).toBeInTheDocument();
  });

  it("keeps the empty history message while the customer has no certificate", async () => {
    await renderFile([]);
    const history = await historyOf();

    expect(await history.findByText("Aucune attestation pour l'instant")).toBeInTheDocument();
    expect(history.queryByRole("link")).toBeNull();
  });
});
