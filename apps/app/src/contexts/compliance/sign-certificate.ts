import { err, ok, type Result } from "@passalio/shared";
import {
  BRANDED_CERTIFICATE_TEMPLATE_VERSION,
  checkBrandedCertificate,
  FLUE_TYPES,
  sweepingDatesAfter,
  type BrandedChimneySweepingCertificate,
  type CertificateError,
  type SweptEquipment,
} from "@passalio/trades";
import * as z from "zod";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { DocumentRecord, EquipmentRecord } from "@/lib/db/local-records";
import { enqueue } from "@/lib/db/outbox";
import { readIssuer } from "./issuer-store";
import { freeNumbers } from "./number-blocks";
import { signingDeviceIdOf } from "./signing-device";

export type CertificateBody = Omit<BrandedChimneySweepingCertificate, "company" | "branding">;

export type SignCertificateInput = {
  readonly documentId: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly interventionId: string;
  readonly equipment: EquipmentRecord;
  readonly body: CertificateBody;
  readonly signedAt: Date;
};

export type SignCertificateError =
  | CertificateError
  | "issuer_missing"
  | "legal_mentions_missing"
  | "no_number_available";

const flueType = z.enum(FLUE_TYPES);

export const sweptEquipmentOf = ({ kind, details }: EquipmentRecord): SweptEquipment => {
  const parsed = flueType.safeParse(details["flueType"]);
  return { kind, flueType: parsed.success ? parsed.data : null };
};

const signedRecordOf = (
  input: SignCertificateInput,
  certificate: BrandedChimneySweepingCertificate,
  { number, numberPrefix }: { readonly number: number; readonly numberPrefix: string },
): DocumentRecord => {
  const at = input.signedAt.toISOString();
  return {
    id: input.documentId,
    organizationId: input.organizationId,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
    interventionId: input.interventionId,
    equipmentId: input.equipment.id,
    kind: "chimney_sweeping_certificate",
    templateVersion: BRANDED_CERTIFICATE_TEMPLATE_VERSION,
    number,
    numberPrefix,
    signedByUserId: input.userId,
    signedAt: at,
    completedOn: certificate.completedOn,
    cancelsDocumentId: null,
    data: certificate,
  };
};

const signInTransaction = async (
  database: LocalDatabase,
  input: SignCertificateInput,
): Promise<Result<DocumentRecord, SignCertificateError>> => {
  const issuer = await readIssuer(database);
  if (issuer === undefined) {
    return err("issuer_missing");
  }
  if (issuer.company === null) {
    return err("legal_mentions_missing");
  }
  const certificate = checkBrandedCertificate(
    { ...input.body, company: issuer.company, branding: issuer.branding },
    sweptEquipmentOf(input.equipment),
  );
  if (!certificate.isOk) {
    return certificate;
  }
  const [free] = await freeNumbers(database, input.userId);
  if (free === undefined) {
    return err("no_number_available");
  }
  const document = signedRecordOf(input, certificate.value, free);
  await database.documents.add(document);
  await database.equipments.update(input.equipment.id, {
    ...sweepingDatesAfter(input.equipment.lastSweepingOn, document.completedOn),
    updatedAt: document.signedAt,
  });
  await enqueue(database, {
    type: "sign_document",
    documentId: document.id,
    interventionId: document.interventionId,
    equipmentId: document.equipmentId,
    deviceId: await signingDeviceIdOf(database),
    kind: document.kind,
    templateVersion: document.templateVersion,
    number: document.number,
    signedAt: document.signedAt,
    data: certificate.value,
  });
  return ok(document);
};

export const signCertificate = (database: LocalDatabase, input: SignCertificateInput) =>
  database.transaction(
    "rw",
    [
      database.localSettings,
      database.numberBlocks,
      database.documents,
      database.equipments,
      database.outbox,
    ],
    () => signInTransaction(database, input),
  );
