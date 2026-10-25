import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { serverDocumentRecord } from "@/lib/sync/planning-test-records";
import { insertEquipment } from "@/test-support/certificate-records";
import {
  INSERT_ID,
  sealedBoiler,
  seedCertificateVisit,
  STOVE_ID,
  stoveEquipment,
  VISIT_ID,
} from "@/test-support/certificate-visit";
import { renderScreen } from "@/test-support/render-screen";
import { findBusyElement } from "@/test-support/skeletons";
import { draftValuesOf } from "../../draft-store";
import { CertificateFormScreen } from "./certificate-form-screen";

const renderForm = async (
  equipmentId = INSERT_ID,
  seed: Parameters<typeof seedCertificateVisit>[1] = {},
) => {
  const rendered = renderScreen(
    <CertificateFormScreen interventionId={VISIT_ID} equipmentId={equipmentId} />,
  );
  await seedCertificateVisit(rendered.database, seed);
  return rendered;
};

const draftOf = async (
  database: Awaited<ReturnType<typeof renderForm>>["database"],
  equipmentId: string,
) => draftValuesOf(await database.certificateDrafts.get(`${VISIT_ID}:${equipmentId}`));

describe("CertificateFormScreen", () => {
  it("shows a skeleton shaped like the form while the visit loads", async () => {
    const { container } = renderScreen(
      <CertificateFormScreen interventionId={VISIT_ID} equipmentId={INSERT_ID} />,
    );
    const busy = await findBusyElement(container);
    expect(busy.querySelectorAll("[data-slot='skeleton']").length).toBeGreaterThan(4);
  });

  it("prefills the form from the equipment and the visit", async () => {
    await renderForm();
    expect(await screen.findByText("Étape 1 sur 2")).toBeVisible();
    expect(screen.getAllByText("Insert bois · Invicta").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/^Conduit/)).toHaveValue("Conduit maçonné tubé, séjour");
    expect(screen.getByRole("checkbox", { name: /Tuyau de raccordement/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Ramonage mécanique/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Toute la longueur" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Bon état" })).toBeChecked();
    expect(screen.getByLabelText(/^Visite/)).toHaveValue("2026-10-23");
    expect(screen.queryByText(/Facultatif/)).toBeNull();
  });

  it("refuses a certificate without mechanical sweeping or a described partial sweep", async () => {
    const { user, database, router } = await renderForm();
    await user.click(await screen.findByRole("checkbox", { name: /Ramonage mécanique/ }));
    await user.click(screen.getByRole("radio", { name: "Ramonage partiel" }));
    expect(screen.getByText(/n'attestera pas la vacuité sur toute la longueur/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Continuer" }));
    expect(
      await screen.findByText(
        "Le certificat demande un ramonage mécanique de la paroi intérieure.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Précisez la partie du conduit non accessible.")).toBeVisible();
    expect(await draftOf(database, INSERT_ID)).toBeUndefined();
    expect(router.state.location.pathname).toBe("/");
  });

  it("asks for details when the anomaly is « Autre »", async () => {
    const { user } = await renderForm();
    await user.click(await screen.findByRole("button", { name: "Autre" }));
    expect(screen.getByRole("button", { name: "Autre" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Continuer" }));
    expect(await screen.findByText("Précisez l'anomalie.")).toBeVisible();
  });

  it("keeps the values on the phone and opens the next equipment, then the signatures", async () => {
    const { user, database, router } = await renderForm(INSERT_ID, {
      equipments: [insertEquipment(INSERT_ID, { brand: "Invicta" }), stoveEquipment()],
    });
    await user.click(await screen.findByRole("button", { name: "Bistre ou goudron" }));
    await user.type(screen.getByLabelText(/^Précision/), "débistrage conseillé");
    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "Continuer" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/passages/${VISIT_ID}/certificat/${STOVE_ID}`),
    );
    expect(await draftOf(database, INSERT_ID)).toMatchObject({
      anomalyKinds: ["soot"],
      anomalyDetails: "débistrage conseillé",
      isDoNotUse: true,
    });
  });

  it("goes to the signatures when every equipment is filled", async () => {
    const { user, router } = await renderForm();
    await user.click(await screen.findByRole("button", { name: "Continuer" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/passages/${VISIT_ID}/signature`),
    );
  });

  it("reopens a saved draft as it was left", async () => {
    const rendered = renderScreen(
      <CertificateFormScreen interventionId={VISIT_ID} equipmentId={INSERT_ID} />,
    );
    await rendered.database.certificateDrafts.put({
      id: `${VISIT_ID}:${INSERT_ID}`,
      interventionId: VISIT_ID,
      equipmentId: INSERT_ID,
      values: {
        flueDesignation: "Conduit inox",
        isConnectionPipeSwept: false,
        isMechanicalSweeping: true,
        sweepingExtent: "partial",
        unsweptPart: "Coude",
        chimneyStacks: "needs_repair",
        anomalyKinds: [],
        anomalyDetails: "",
        isDoNotUse: false,
        visitedOn: "2026-10-22",
        lastSweepingOn: "",
        lastServiceOn: "",
      },
      updatedAt: "2026-10-23T08:00:00.000Z",
    });
    await seedCertificateVisit(rendered.database);
    expect(await screen.findByDisplayValue("Conduit inox")).toBeVisible();
    expect(screen.getByLabelText(/^Partie non accessible/)).toHaveValue("Coude");
    expect(screen.getByRole("radio", { name: "À reprendre" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Tuyau de raccordement/ })).not.toBeChecked();
  });

  it("explains that a sealed appliance gets no sweeping certificate", async () => {
    await renderForm("equipment-boiler", { equipments: [sealedBoiler()] });
    expect(
      await screen.findByRole("heading", {
        name: "Pas de certificat de ramonage pour cet appareil",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Retour au passage" })).toBeVisible();
  });

  it("shows a missing equipment as not found", async () => {
    await renderForm("equipment-unknown");
    expect(await screen.findByRole("heading", { name: "Appareil introuvable" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Retour au planning" })).toBeVisible();
  });

  it("never reopens a signed certificate", async () => {
    const rendered = await renderForm();
    await rendered.database.documents.put(serverDocumentRecord("document-1", VISIT_ID, INSERT_ID));
    expect(await screen.findByRole("heading", { name: "Certificat déjà signé" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Voir le certificat" })).toBeVisible();
  });
});
