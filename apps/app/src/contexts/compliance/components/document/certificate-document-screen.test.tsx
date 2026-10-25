import { err, ok } from "@passalio/shared";
import { pdfFingerprint } from "@passalio/pdf";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { DocumentRecord } from "@/lib/db/local-records";
import { enqueue } from "@/lib/db/outbox";
import { seedCertificateVisit, signedCertificateDocument } from "@/test-support/certificate-visit";
import { renderScreen } from "@/test-support/render-screen";
import { findBusyElement } from "@/test-support/skeletons";
import { CertificateDocumentScreen } from "./certificate-document-screen";

const PDF_BYTES = [37, 80, 68, 70, 45, 49, 46, 55];

const context = vi.hoisted(() => ({ isRenderable: true, arePagesReadable: true }));

vi.mock("@/lib/pdf/signed-certificate-pdf", () => ({
  renderSignedCertificate: async () =>
    context.isRenderable ? ok(new Uint8Array(PDF_BYTES)) : err("invalid_certificate"),
}));

vi.mock("@/lib/pdf/pdf-page-images", () => ({
  pdfPageImages: async () => {
    if (!context.arePagesReadable) {
      throw new Error("unreadable");
    }
    return ["data:image/png;base64,cGFnZTE=", "data:image/png;base64,cGFnZTI="];
  },
}));

const renderedFingerprint = () => pdfFingerprint(new Uint8Array(PDF_BYTES));

const renderDocument = async (
  documents: readonly DocumentRecord[],
  seed: (database: LocalDatabase) => Promise<unknown> = async () => undefined,
) => {
  const rendered = renderScreen(<CertificateDocumentScreen documentId="document-1" />);
  await seedCertificateVisit(rendered.database);
  await rendered.database.documents.bulkPut([...documents]);
  await seed(rendered.database);
  return rendered;
};

afterEach(() => {
  context.isRenderable = true;
  context.arePagesReadable = true;
});

describe("CertificateDocumentScreen", () => {
  it("shows a skeleton while the certificate loads", async () => {
    const { container } = renderScreen(<CertificateDocumentScreen documentId="document-1" />);
    expect(await findBusyElement(container)).toBeTruthy();
  });

  it("presents the signed certificate with its pages, number and signer", async () => {
    await renderDocument([signedCertificateDocument()]);

    expect(
      await screen.findByRole("heading", { level: 1, name: /Certificat RD-2026-0144/ }),
    ).toBeVisible();
    expect(screen.getAllByText("Signé").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Hélène Garnier · Insert bois · Invicta · signé le 23 oct. 2026 à 10:42 par Jean Dupont",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Page 2" })).toBeInTheDocument();
    expect(screen.getByText("Numéro").nextSibling).toHaveTextContent("RD-2026-0144");
    expect(screen.getByText("23 oct. 2026 à 10:42 · Jean Dupont")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Un certificat signé ne se modifie jamais. Il reste consultable tel qu'il a été remis.",
      ),
    ).toBeInTheDocument();
  });

  it("offers to download the PDF under its certificate name", async () => {
    await renderDocument([signedCertificateDocument()]);

    const link = await screen.findByRole("link", { name: "Télécharger" });
    expect(link).toHaveAttribute("download", "certificat-ramonage-RD-2026-0144.pdf");
    expect(screen.getByRole("button", { name: "Partager" })).toBeEnabled();
  });

  it("says the fingerprint comes after the certificate reaches the server", async () => {
    await renderDocument([signedCertificateDocument()]);

    expect(await screen.findByText("Calculée après l'envoi au serveur")).toBeInTheDocument();
  });

  it("verifies the PDF shown against the fingerprint of the archived PDF", async () => {
    const fingerprint = await renderedFingerprint();
    await renderDocument([signedCertificateDocument({ pdfSha256: fingerprint })]);

    expect(
      await screen.findByText(
        `${fingerprint.slice(0, 4)} ${fingerprint.slice(4, 8)} · intégrité vérifiée`,
      ),
    ).toBeInTheDocument();
  });

  it("warns when the PDF shown differs from the archived PDF", async () => {
    const archived = "f".repeat(64);
    await renderDocument([signedCertificateDocument({ pdfSha256: archived })]);

    expect(await screen.findByText("ffff ffff · différente du PDF archivé")).toBeInTheDocument();
  });

  it("shows a cancelled certificate with the number of its correction", async () => {
    await renderDocument([
      signedCertificateDocument(),
      signedCertificateDocument({ id: "document-2", number: 145, cancelsDocumentId: "document-1" }),
    ]);

    expect(await screen.findByText("Annulé", { selector: "h1 span" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ce certificat a été annulé et remplacé par le RD-2026-0145. Il reste consultable.",
      ),
    ).toBeInTheDocument();
  });

  it("says when the certificate still waits to be sent to the server", async () => {
    const document = signedCertificateDocument();
    await renderDocument([document], (database) =>
      enqueue(database, {
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
      }),
    );

    expect(await screen.findByText("Signé · en attente d'envoi")).toBeInTheDocument();
  });

  it("shows an error when the pages cannot be drawn on this device", async () => {
    context.arePagesReadable = false;
    await renderDocument([signedCertificateDocument()]);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Le certificat n'a pas pu être affiché. Téléchargez-le pour le lire.",
    );
  });

  it("explains that a certificate missing from this device cannot be shown", async () => {
    await renderDocument([]);

    expect(await screen.findByRole("heading", { name: "Certificat introuvable" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Retour aux clients" })).toHaveAttribute(
      "href",
      "/clients",
    );
  });
});
