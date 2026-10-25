import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { serverDocumentRecord } from "@/lib/sync/planning-test-records";
import { INSERT_ID, seedCertificateVisit, VISIT_ID } from "@/test-support/certificate-visit";
import { renderScreen } from "@/test-support/render-screen";
import { FillCertificateButton } from "./fill-certificate-button";

const context = vi.hoisted(() => ({ canSign: true }));

vi.mock("@/lib/permissions/use-can", () => ({ useCan: () => context.canSign }));

afterEach(() => {
  context.canSign = true;
});

describe("FillCertificateButton", () => {
  it("opens the form of the first equipment to fill", async () => {
    const { database } = renderScreen(<FillCertificateButton interventionId={VISIT_ID} />);
    await seedCertificateVisit(database);
    expect(await screen.findByRole("link", { name: "Remplir le certificat" })).toHaveAttribute(
      "href",
      `/passages/${VISIT_ID}/certificat/${INSERT_ID}`,
    );
  });

  it("shows the signed certificates once the visit is signed", async () => {
    const { database } = renderScreen(<FillCertificateButton interventionId={VISIT_ID} />);
    await seedCertificateVisit(database);
    await database.documents.put(serverDocumentRecord("document-1", VISIT_ID, INSERT_ID));
    expect(await screen.findByRole("link", { name: "Voir les certificats" })).toHaveAttribute(
      "href",
      `/passages/${VISIT_ID}/certificats-signes`,
    );
  });

  it("stays disabled for a role that cannot sign", async () => {
    context.canSign = false;
    const { database } = renderScreen(<FillCertificateButton interventionId={VISIT_ID} />);
    await seedCertificateVisit(database);
    expect(await screen.findByRole("button", { name: "Remplir le certificat" })).toBeDisabled();
  });
});
