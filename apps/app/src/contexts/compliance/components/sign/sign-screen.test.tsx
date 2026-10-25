import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { RefObject } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { serverDocumentRecord } from "@/lib/sync/planning-test-records";
import { SIGNATURE, insertEquipment } from "@/test-support/certificate-records";
import {
  INSERT_ID,
  seedCertificateVisit,
  STOVE_ID,
  stoveEquipment,
  VISIT_ID,
} from "@/test-support/certificate-visit";
import { renderScreen } from "@/test-support/render-screen";
import { dismissAllToasts } from "@/test-support/toasts";
import type { CertificateFormValues } from "../../certificate-form";
import { saveSignature } from "../../signature-store";
import { SignScreen } from "./sign-screen";

const context = vi.hoisted(() => ({ canEditCompany: true }));

vi.mock("@/lib/permissions/use-can", () => ({
  useCan: (permission: string) => permission !== "organization:update" || context.canEditCompany,
}));

vi.mock("@/contexts/identity", () => ({
  CompanyLegalForm: ({ submitLabel }: { readonly submitLabel: string }) => (
    <p>{`Formulaire légal · ${submitLabel}`}</p>
  ),
}));

vi.mock("../../hooks/use-signature-pad", () => ({
  useSignaturePad: ({
    isEnabled,
    onDraw,
  }: {
    readonly isEnabled: boolean;
    readonly onDraw: (image: string) => void;
  }): { canvasRef: RefObject<HTMLCanvasElement | null>; clear: () => void } => {
    let canvas: HTMLCanvasElement | null = null;
    return {
      canvasRef: {
        get current() {
          return canvas;
        },
        set current(element: HTMLCanvasElement | null) {
          canvas = element;
          if (element !== null && isEnabled) {
            element.addEventListener("pointerup", () => onDraw(SIGNATURE));
          }
        },
      },
      clear: () => undefined,
    };
  },
}));

const FILLED: CertificateFormValues = {
  flueDesignation: "Conduit maçonné tubé, séjour",
  isConnectionPipeSwept: true,
  isMechanicalSweeping: true,
  sweepingExtent: "full_length",
  unsweptPart: "",
  chimneyStacks: "good",
  anomalyKinds: ["soot"],
  anomalyDetails: "",
  isDoNotUse: false,
  visitedOn: "2026-10-23",
  lastSweepingOn: "",
  lastServiceOn: "",
};

type Seed = Parameters<typeof seedCertificateVisit>[1] & {
  readonly drafted?: readonly string[];
};

const renderSign = async ({ drafted = [INSERT_ID], ...seed }: Seed = {}) => {
  const rendered = renderScreen(<SignScreen interventionId={VISIT_ID} />);
  await rendered.database.certificateDrafts.bulkPut(
    drafted.map((equipmentId) => ({
      id: `${VISIT_ID}:${equipmentId}`,
      interventionId: VISIT_ID,
      equipmentId,
      values: FILLED,
      updatedAt: "2026-10-23T08:00:00.000Z",
    })),
  );
  await seedCertificateVisit(rendered.database, seed);
  await screen.findByText("Étape 2 sur 2");
  return rendered;
};

const sign = (pad: RegExp) => fireEvent.pointerUp(screen.getByLabelText(pad));

afterEach(() => {
  context.canEditCompany = true;
  dismissAllToasts();
});

describe("SignScreen", () => {
  it("sums up each certificate and attaches the usage advice", async () => {
    const { user } = await renderSign();
    expect(screen.getByText("Vacuité sur toute la longueur · Bistre ou goudron")).toBeVisible();
    expect(screen.getByRole("link", { name: "Modifier" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Lire" }));
    const advice = await screen.findByRole("dialog", { name: "Conseils d'utilisation" });
    expect(within(advice).getByText("Les risques")).toBeVisible();
  });

  it("asks for every missing signature and certificate before signing", async () => {
    const { user, database } = await renderSign({
      equipments: [insertEquipment(INSERT_ID), stoveEquipment()],
    });
    expect(screen.getByText("À remplir")).toBeVisible();
    expect(screen.getByRole("link", { name: "Remplir" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Signer les 2 certificats" }));
    expect(
      await screen.findByText("Remplissez le certificat de chaque appareil avant de signer."),
    ).toBeVisible();
    expect(screen.getByText("Signez en tant que technicien.")).toBeVisible();
    expect(screen.getByText("Faites signer le client ou cochez « Client absent ».")).toBeVisible();
    expect(await database.documents.count()).toBe(0);
  });

  it("signs every certificate of the visit at once and opens the signed screen", async () => {
    const { user, database, router } = await renderSign({
      equipments: [insertEquipment(INSERT_ID), stoveEquipment()],
      drafted: [INSERT_ID, STOVE_ID],
    });
    sign(/^Signature du technicien/);
    sign(/^Signature du client/);
    await user.click(screen.getByRole("button", { name: "Signer les 2 certificats" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/passages/${VISIT_ID}/certificats-signes`),
    );
    expect(await screen.findByText("2 certificats signés.")).toBeVisible();
    const documents = await database.documents.toArray();
    expect(
      documents.map(({ number }) => number).toSorted((left, right) => left - right),
    ).toStrictEqual([1, 2]);
    expect(documents[0]?.data).toMatchObject({
      customerSignature: SIGNATURE,
      isCustomerAbsent: false,
      technician: { name: "Jean Dupont" },
    });
    expect(await database.certificateDrafts.count()).toBe(0);
    expect(await database.outbox.count()).toBe(2);
  });

  it("reuses the technician's saved signature and lets the customer be absent", async () => {
    const rendered = renderScreen(<SignScreen interventionId={VISIT_ID} />);
    await saveSignature(rendered.database, "user-1", SIGNATURE);
    await rendered.database.certificateDrafts.put({
      id: `${VISIT_ID}:${INSERT_ID}`,
      interventionId: VISIT_ID,
      equipmentId: INSERT_ID,
      values: FILLED,
      updatedAt: "2026-10-23T08:00:00.000Z",
    });
    await seedCertificateVisit(rendered.database);
    expect(await screen.findByText("Jean Dupont · signature enregistrée")).toBeVisible();
    await rendered.user.click(screen.getByRole("checkbox", { name: /Client absent/ }));
    await rendered.user.click(screen.getByRole("button", { name: "Signer le certificat" }));
    await waitFor(async () => expect(await rendered.database.documents.count()).toBe(1));
    const [document] = await rendered.database.documents.toArray();
    expect(document?.data).toMatchObject({ customerSignature: null, isCustomerAbsent: true });
  });

  it("asks the owner for the legal mentions before the first certificate", async () => {
    const { user, database } = await renderSign({
      issuer: {
        company: null,
        missingLegalMentions: ["legalForm"],
        branding: {
          template: "plain",
          brandColor: "#0E7C5A",
          logo: null,
          contact: { phone: null, email: null, website: null },
          customerMessage: null,
          footerText: null,
        },
      },
    });
    sign(/^Signature du technicien/);
    sign(/^Signature du client/);
    await user.click(screen.getByRole("button", { name: "Signer le certificat" }));
    const sheet = await screen.findByRole("dialog", { name: "Avant votre premier certificat" });
    expect(within(sheet).getByText("Formulaire légal · Enregistrer et signer")).toBeVisible();
    expect(await database.documents.count()).toBe(0);
  });

  it("explains that the company settings must reach the phone before signing", async () => {
    context.canEditCompany = false;
    const { user } = await renderSign({ issuer: null });
    sign(/^Signature du technicien/);
    sign(/^Signature du client/);
    await user.click(screen.getByRole("button", { name: "Signer le certificat" }));
    expect(
      await screen.findByText(
        "Les réglages de l'entreprise ne sont pas encore sur ce téléphone. Ouvrez l'application une fois avec du réseau.",
      ),
    ).toBeVisible();
  });

  it("shows a technician the manager notice in the legal sheet", async () => {
    context.canEditCompany = false;
    const { user } = await renderSign({
      issuer: {
        company: null,
        missingLegalMentions: ["address"],
        branding: {
          template: "plain",
          brandColor: "#0E7C5A",
          logo: null,
          contact: { phone: null, email: null, website: null },
          customerMessage: null,
          footerText: null,
        },
      },
    });
    sign(/^Signature du technicien/);
    sign(/^Signature du client/);
    await user.click(screen.getByRole("button", { name: "Signer le certificat" }));
    const sheet = await screen.findByRole("dialog", {
      name: "Informations de l'entreprise incomplètes",
    });
    expect(
      within(sheet).getByText(
        "Les informations de l'entreprise sont incomplètes. Prévenez votre gérant.",
      ),
    ).toBeVisible();
    await user.click(within(sheet).getByRole("button", { name: "J'ai compris" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("says when every certificate of the visit is already signed", async () => {
    const rendered = renderScreen(<SignScreen interventionId={VISIT_ID} />);
    await rendered.database.documents.put(serverDocumentRecord("document-1", VISIT_ID, INSERT_ID));
    await seedCertificateVisit(rendered.database);
    expect(await screen.findByRole("heading", { name: "Certificat déjà signé" })).toBeVisible();
  });
});
