import { err, ok } from "@passalio/shared";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import { enqueue } from "@/lib/db/outbox";
import { serverInterventionRecord } from "@/lib/sync/planning-test-records";
import { certificateBody, sampleIssuer } from "@/test-support/certificate-records";
import {
  INSERT_ID,
  seedCertificateVisit,
  VISIT_DAY,
  VISIT_ID,
} from "@/test-support/certificate-visit";
import { renderScreen } from "@/test-support/render-screen";
import { findBusyElement } from "@/test-support/skeletons";
import { SignedScreen } from "./signed-screen";

const context = vi.hoisted(() => ({ isRenderable: true }));

vi.mock("@/lib/pdf/signed-certificate-pdf", () => ({
  renderSignedCertificate: async () =>
    context.isRenderable ? ok(new Uint8Array([37, 80, 68, 70])) : err("invalid_certificate"),
}));

const { branding } = sampleIssuer();

const signedDocument = (overrides: { readonly isAdviceAttached?: boolean } = {}) => ({
  id: "document-1",
  organizationId: "organization-a",
  createdAt: "2026-10-23T08:42:00.000Z",
  updatedAt: "2026-10-23T08:42:00.000Z",
  deletedAt: null,
  interventionId: VISIT_ID,
  equipmentId: INSERT_ID,
  kind: "chimney_sweeping_certificate" as const,
  templateVersion: 2,
  number: 144,
  numberPrefix: "RD-2026-",
  signedByUserId: "user-1",
  signedAt: "2026-10-23T08:42:00.000Z",
  completedOn: VISIT_DAY,
  cancelsDocumentId: null,
  data: {
    ...certificateBody({ isAdviceAttached: overrides.isAdviceAttached ?? true }),
    company: sampleIssuer().company,
    branding,
  },
});

const renderSigned = async (seed: (database: LocalDatabase) => Promise<unknown>) => {
  const rendered = renderScreen(<SignedScreen interventionId={VISIT_ID} />);
  await seedCertificateVisit(rendered.database);
  await seed(rendered.database);
  return rendered;
};

afterEach(() => {
  context.isRenderable = true;
});

describe("SignedScreen", () => {
  it("shows a skeleton while the visit loads", async () => {
    const { container } = renderScreen(<SignedScreen interventionId={VISIT_ID} />);
    expect(await findBusyElement(container)).toBeTruthy();
  });

  it("presents the signed certificate, its PDF and the next sweeping date", async () => {
    await renderSigned((database) => database.documents.put(signedDocument()));
    expect(await screen.findByRole("heading", { name: "Certificat signé" })).toBeVisible();
    expect(
      screen.getByText(
        "N° RD-2026-0144 · Hélène Garnier · 23 oct. 2026 à 10:42. Il ne peut plus être modifié.",
      ),
    ).toBeVisible();
    expect(screen.getByText("certificat-ramonage-RD-2026-0144.pdf")).toBeVisible();
    expect(screen.getByText("2 pages · certificat et conseils d'utilisation")).toBeVisible();
    expect(screen.getByText("Enregistré sur le serveur")).toBeVisible();
    expect(screen.getByText("23 oct. 2027")).toBeVisible();
    const download = await screen.findByRole("link", { name: "Télécharger" });
    expect(download).toHaveAttribute("download", "certificat-ramonage-RD-2026-0144.pdf");
    expect(screen.getByRole("link", { name: "Voir le PDF" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("button", { name: "Partager" })).toBeVisible();
  });

  it("says when the certificate still waits for the network", async () => {
    await renderSigned(async (database) => {
      const document = signedDocument({ isAdviceAttached: false });
      await database.documents.put(document);
      await enqueue(database, {
        type: "sign_document",
        documentId: document.id,
        interventionId: document.interventionId,
        equipmentId: document.equipmentId,
        deviceId: "0190f3a0-0000-7000-8000-00000000d001",
        kind: document.kind,
        templateVersion: document.templateVersion,
        number: document.number,
        signedAt: document.signedAt,
        data: document.data,
      });
    });
    expect(await screen.findByText("En attente d'envoi au serveur")).toBeVisible();
    expect(screen.getByText("1 page · certificat")).toBeVisible();
  });

  it("explains when the PDF cannot be prepared on the phone", async () => {
    context.isRenderable = false;
    await renderSigned((database) => database.documents.put(signedDocument()));
    expect(
      await screen.findByText("Le PDF n'a pas pu être préparé sur ce téléphone."),
    ).toBeVisible();
  });

  it("leads to the next visit of the day", async () => {
    await renderSigned(async (database) => {
      await database.documents.put(signedDocument());
      await database.interventions.put(
        serverInterventionRecord("visit-2", {
          scheduledDate: VISIT_DAY,
          startTime: "11:30",
          customerId: "customer-1",
          siteId: "site-1",
        }),
      );
    });
    expect(await screen.findByText("Passage suivant")).toBeVisible();
    expect(screen.getByText("11:30")).toBeVisible();
    expect(screen.getByRole("link", { name: "Y aller" })).toHaveAttribute(
      "href",
      "/passages/visit-2",
    );
  });

  it("offers the way back to the visit when the day is over", async () => {
    await renderSigned((database) => database.documents.put(signedDocument()));
    expect(await screen.findByRole("link", { name: "Retour au passage" })).toHaveAttribute(
      "href",
      `/passages/${VISIT_ID}`,
    );
  });
});
